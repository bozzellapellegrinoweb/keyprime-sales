-- FASE 2 — sales e clienti.
--
-- NON APPLICATA, E NON APPLICABILE COSI' COM'E'. Leggere prima il blocco
-- "PREMESSA", perche' questo file da solo spegnerebbe il portale.
--
-- ============================================================================
-- PREMESSA: il database non sa chi sta chiedendo
-- ============================================================================
--
-- Il brief chiede policy "admin vede tutto, agente solo i propri lead,
-- segnalatore solo i propri". E' il risultato giusto, ma non si ottiene
-- scrivendo solo queste policy, perche' manca il presupposto.
--
-- Il portale NON usa Supabase Auth: ha il suo login (app_login emette un token
-- UUID che vive in app_sessions). Verificato: in tutto il codice non c'e' una
-- sola chiamata a supabase.auth. Ogni query arriva a PostgREST con la chiave
-- anonima, quindi auth.uid() e' null e auth.jwt() e' vuoto. Una policy del
-- tipo "assegnato_a = auth.jwt()->>'nome'" sarebbe sempre falsa: non
-- nasconderebbe i lead agli agenti, li nasconderebbe a tutti.
--
-- Perche' si rompe anche il resto: 21 punti del portale leggono o scrivono
-- queste due tabelle con la chiave anonima, e 23 punti delle funzioni
-- serverless fanno lo stesso. Queste ultime passano solo se
-- SUPABASE_SERVICE_ROLE_KEY e' configurata su Vercel (api/_lib/supabase.mjs
-- ripiega sulla chiave anonima quando manca). DA VERIFICARE PRIMA DI TUTTO.
--
-- Ci sono due strade per dare un'identita' al database. Le policy qui sotto
-- sono scritte per la strada B, che e' quella che consiglio.
--
-- ----------------------------------------------------------------------------
-- STRADA A — letture attraverso funzioni SECURITY DEFINER
-- ----------------------------------------------------------------------------
-- RLS chiusa, nessuna policy, e si aggiungono funzioni che prendono p_token e
-- applicano le regole (lo schema gia' usato da immobili_elenco e da tutte le
-- app_*). Il portale smette di fare .from('sales') e chiama .rpc().
--
--   + nessuna chiave nuova da gestire, nessuna infrastruttura
--   + coerente con quello che c'e' gia'
--   - 21 punti di chiamata da riscrivere, ciascuno con filtri e select diversi
--   - la protezione dipende dal fatto che chi scrive codice domani si ricordi
--     di usare la funzione. Una .from('sales') dimenticata non e' filtrata:
--     e' una convenzione, non una garanzia
--
-- ----------------------------------------------------------------------------
-- STRADA B — il portale conia un JWT per la sessione  (consigliata)
-- ----------------------------------------------------------------------------
-- Al login un endpoint serverless, dopo aver validato il token di sessione,
-- conia un JWT breve coi claim che servono (role, nome, ruolo) e il client lo
-- manda come Authorization: Bearer. Le policy qui sotto allora funzionano.
--
--   + una .from('sales') qualsiasi e' filtrata dal database, anche scritta
--     fra un anno da qualcun altro: garanzia, non convenzione
--   + il front-end cambia in un punto solo (l'opzione accessToken del client)
--   + le funzioni serverless non cambiano: la service_role scavalca RLS
--   - c'e' una chiave di firma da generare, importare e ruotare
--   - se il conio si rompe, nessuno legge piu' niente
--
-- Quello che la documentazione Supabase dice, verificato il 2026-11-23:
--   * il "legacy JWT secret" condiviso e' "no longer recommended, available
--     for backward compatibility", con una "plan for revocation": non ci si
--     costruisce sopra;
--   * i JWT propri si firmano con una chiave propria importata nel progetto,
--     ES256 ("supabase gen signing-key --algorithm ES256"), e si mandano in
--     Authorization: Bearer mentre l'header apikey tiene la chiave
--     pubblicabile;
--   * il claim "role" deve valere un ruolo Postgres esistente (authenticated),
--     altrimenti la richiesta gira come anon.
--
-- COSA NON HO VERIFICATO: che auth.jwt() esponga alle policy i claim
-- PERSONALIZZATI (nome, ruolo) di un token coniato da noi. La pagina sulle
-- signing keys non lo dice, e non ho trovato una pagina che lo affermi. Per la
-- pagina sui provider OIDC il claim "sub" si legge con auth.jwt()->>'sub', e
-- il percorso del token e' lo stesso — ma "lo stesso percorso" non e' una
-- prova. Si verifica in dieci minuti: si conia un token di prova, si fa una
-- select, si guarda. Da fare PRIMA di riscrivere qualsiasi cosa.
--
-- ============================================================================
-- Le policy (strada B)
-- ============================================================================

alter table public.sales   enable row level security;
alter table public.clienti enable row level security;

-- Niente accesso diretto per chi non porta un JWT: la chiave anonima nuda
-- resta fuori. La service_role scavalca e non va nominata.
revoke select, insert, update, delete on public.sales   from anon;
revoke select, insert, update, delete on public.clienti from anon;

-- Chi sono: il nome dell'utente, dal claim del token.
-- Si usa il NOME e non un id perche' sales.assegnato_a, sales.agente e
-- clienti.created_by contengono nomi — e' il modello che c'e', non quello che
-- sceglierei da zero.
create or replace function public.jwt_nome()
returns text language sql stable
as $$ select nullif(auth.jwt() ->> 'nome', '') $$;

create or replace function public.jwt_ruolo()
returns text language sql stable
as $$ select nullif(auth.jwt() ->> 'ruolo', '') $$;

-- ---- sales ----------------------------------------------------------------

drop policy if exists "sales: admin vede tutto" on public.sales;
create policy "sales: admin vede tutto"
  on public.sales for select to authenticated
  using (public.jwt_ruolo() = 'admin');

drop policy if exists "sales: agente vede i suoi" on public.sales;
create policy "sales: agente vede i suoi"
  on public.sales for select to authenticated
  using (
    public.jwt_ruolo() in ('agente', 'agente_admin')
    and (assegnato_a = public.jwt_nome() or agente = public.jwt_nome())
  );

drop policy if exists "sales: segnalatore vede i suoi" on public.sales;
create policy "sales: segnalatore vede i suoi"
  on public.sales for select to authenticated
  using (public.jwt_ruolo() = 'segnalatore' and segnalatore = public.jwt_nome());

-- In scrittura si e' piu' stretti: un agente modifica cio' che gli e'
-- assegnato, e non puo' passarlo a un altro (quello lo fa l'assegnazione,
-- che gira in SECURITY DEFINER).
drop policy if exists "sales: admin modifica tutto" on public.sales;
create policy "sales: admin modifica tutto"
  on public.sales for all to authenticated
  using (public.jwt_ruolo() = 'admin')
  with check (public.jwt_ruolo() = 'admin');

drop policy if exists "sales: agente modifica i suoi" on public.sales;
create policy "sales: agente modifica i suoi"
  on public.sales for update to authenticated
  using (
    public.jwt_ruolo() in ('agente', 'agente_admin')
    and (assegnato_a = public.jwt_nome() or agente = public.jwt_nome())
  )
  with check (assegnato_a = public.jwt_nome() or agente = public.jwt_nome());

drop policy if exists "sales: inserimento da chi e' dentro" on public.sales;
create policy "sales: inserimento da chi e' dentro"
  on public.sales for insert to authenticated
  with check (public.jwt_nome() is not null);

-- ---- clienti --------------------------------------------------------------

drop policy if exists "clienti: admin vede tutto" on public.clienti;
create policy "clienti: admin vede tutto"
  on public.clienti for select to authenticated
  using (public.jwt_ruolo() = 'admin');

drop policy if exists "clienti: chi lo segue lo vede" on public.clienti;
create policy "clienti: chi lo segue lo vede"
  on public.clienti for select to authenticated
  using (
    public.jwt_ruolo() <> 'admin'
    and (
      created_by = public.jwt_nome()
      or agente_riferimento = public.jwt_nome()
      or assegnato_a = public.jwt_nome()
    )
  );

drop policy if exists "clienti: admin modifica tutto" on public.clienti;
create policy "clienti: admin modifica tutto"
  on public.clienti for all to authenticated
  using (public.jwt_ruolo() = 'admin')
  with check (public.jwt_ruolo() = 'admin');

drop policy if exists "clienti: chi lo segue lo modifica" on public.clienti;
create policy "clienti: chi lo segue lo modifica"
  on public.clienti for update to authenticated
  using (
    created_by = public.jwt_nome()
    or agente_riferimento = public.jwt_nome()
    or assegnato_a = public.jwt_nome()
  )
  with check (
    created_by = public.jwt_nome()
    or agente_riferimento = public.jwt_nome()
    or assegnato_a = public.jwt_nome()
  );

drop policy if exists "clienti: inserimento da chi e' dentro" on public.clienti;
create policy "clienti: inserimento da chi e' dentro"
  on public.clienti for insert to authenticated
  with check (public.jwt_nome() is not null);

-- ============================================================================
-- Prima di applicare, in quest'ordine
-- ============================================================================
--
-- 1. Verificare che SUPABASE_SERVICE_ROLE_KEY sia configurata su Vercel.
--    Senza, le 23 chiamate delle funzioni serverless girano come anon e si
--    fermano tutte: webhook GHL, promemoria, sincronizzazioni.
-- 2. Verificare su un branch Supabase che auth.jwt() esponga davvero i claim
--    nome e ruolo di un token coniato da noi.
-- 3. Solo allora: conio del token al login, opzione accessToken sul client,
--    e questo file.
--
-- Fino al punto 3 compreso, la fase 1 (tabelle inutilizzate) puo' andare
-- avanti da sola: e' indipendente.
