-- APPLICATA il 2026-11-23 (in due passaggi: chiusura_vista_team e
-- team_visibile_colonne_sensibili; qui sono uniti, lo stato finale e' questo).
--
-- La vista team_members era leggibile da chiunque avesse la chiave pubblica,
-- che sta nel bundle. user_credentials ha RLS, ma una vista gira coi permessi
-- del proprietario e la scavalca: da fuori si leggevano nome, email, username,
-- telefono, percentuale di commissione, ultimo accesso e ghl_user_id di tutti
-- e dodici. Stesso difetto, e stesso rimedio, di sales_with_commissions.
--
-- Provato: la vista risponde 401 senza token (era 206 con content-range */12);
-- la funzione risponde [] senza token e 12 righe con un token valido.
revoke select on public.team_members from anon, authenticated;

-- Il taglio fra colleghi e' volutamente leggero: nome, ruolo, email, username
-- e telefono restano visibili a chi e' dentro — sono dodici persone che
-- lavorano insieme, i nomi girano gia' nelle tendine di assegnazione e gli
-- username sono nome.cognome, quindi nasconderli non comprerebbe niente.
--
-- Sono riservate ad admin, o alla propria riga, le cose che un agente non deve
-- sapere dei colleghi: quanto prendono, quando sono entrati l'ultima volta, se
-- devono ancora impostare la password, il loro id GHL. La propria riga per
-- intero serve a percentualeAgente (src/lib/leads.js) e ai recapiti stampati
-- sulle offerte (src/lib/offertaPdf.js).
create or replace function public.team_visibile()
returns setof public.team_members
language sql stable security definer
set search_path to 'public', 'extensions'
as $$
  select
    t.id,
    t.created_at,
    t.nome,
    t.email,
    t.username,
    t.ruolo,
    t.attivo,
    t.referente,
    case when public.kp_ruolo() = 'admin' or t.nome = public.kp_nome()
         then t.commission_pct end as commission_pct,
    t.telefono,
    case when public.kp_ruolo() = 'admin' or t.nome = public.kp_nome()
         then t.must_change_password end as must_change_password,
    case when public.kp_ruolo() = 'admin' or t.nome = public.kp_nome()
         then t.last_login_at end as last_login_at,
    case when public.kp_ruolo() = 'admin' or t.nome = public.kp_nome()
         then t.ghl_user_id end as ghl_user_id
  from public.team_members t
  where public.kp_nome() is not null
  order by t.nome
$$;

grant execute on function public.team_visibile() to anon, authenticated;
