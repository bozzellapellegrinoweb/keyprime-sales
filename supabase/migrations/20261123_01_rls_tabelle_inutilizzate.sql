-- FASE 1 — Chiusura delle tabelle che nessuno legge.
--
-- APPLICATA il 2026-11-23 (versione 20261123165835 nel database).
--
-- Perche' e' separata dal resto: queste tre tabelle non compaiono in nessun
-- punto del codice, ne' nel portale ne' nel sito pubblico ne' nelle funzioni
-- serverless. Verificato con una ricerca su src/ e api/ di entrambi i
-- repository: zero occorrenze.
--
--   users                 2 righe   (il portale usa user_credentials, non questa)
--   cliente_interazioni   0 righe
--   email_log             0 righe
--
-- Quindi chiuderle non puo' rompere niente: non c'e' niente da rompere.
-- E' il pezzo di sicurezza che si puo' applicare oggi senza toccare una riga
-- di applicazione.
--
-- Cosa cambia: con RLS attiva e nessuna policy, la chiave anonima non legge
-- e non scrive piu'. La service_role continua a passare (scavalca RLS per
-- progettazione), quindi un domani una funzione serverless puo' usarle.

alter table public.users                enable row level security;
alter table public.cliente_interazioni  enable row level security;
alter table public.email_log            enable row level security;

-- Nessuna policy: senza policy, RLS nega tutto a chi non scavalca.
-- Si revocano anche i permessi di tabella, cosi' il rifiuto arriva prima
-- ancora di valutare le policy.
revoke select, insert, update, delete on public.users               from anon, authenticated;
revoke select, insert, update, delete on public.cliente_interazioni from anon, authenticated;
revoke select, insert, update, delete on public.email_log           from anon, authenticated;

comment on table public.users is
  'Legacy: il portale usa user_credentials. RLS chiusa il 2026-11-23, nessun accesso anon.';

-- Come verificare che abbia funzionato, dopo l'applicazione:
--
--   curl -sI -X HEAD \
--     "https://wqtylxrrerhbxagdzftn.supabase.co/rest/v1/users?select=id&limit=0" \
--     -H "apikey: <chiave anon>" -H "Authorization: Bearer <chiave anon>" \
--     -H "Prefer: count=exact"
--
-- Prima: HTTP 206 con content-range */2
-- Dopo:  HTTP 401 oppure 200 con content-range */0
