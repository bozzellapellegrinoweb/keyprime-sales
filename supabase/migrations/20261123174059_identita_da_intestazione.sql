-- APPLICATA il 2026-11-23.
--
-- Questo file risolve la premessa che bloccava 20261123_02_rls_sales_clienti.sql:
-- "il database non sa chi sta chiedendo". La strada presa non e' quella che
-- quel file consigliava (coniare JWT). E' piu' semplice, e non introduce una
-- chiave di firma da gestire e ruotare.

drop function if exists public.prova_intestazioni();

-- Chi sta chiedendo, secondo il database.
--
-- Il portale non usa Supabase Auth: ha il suo token di sessione, gia' in
-- localStorage e gia' mandato a /api come intestazione x-kp-token. PostgREST
-- passa le intestazioni della richiesta al database, quindi quel token puo'
-- identificare chi chiede anche qui — senza coniare JWT, senza gestire chiavi
-- di firma, e senza riscrivere i ventidue punti del front-end che leggono e
-- scrivono.
--
-- stable, non volatile: Postgres puo' valutarla una volta per istruzione
-- invece che una volta per riga. Su una tabella di qualche migliaio di righe
-- la differenza e' fra istantaneo e inutilizzabile.
create or replace function public.kp_sessione()
returns public.user_credentials
language plpgsql stable security definer
set search_path to 'public', 'extensions'
as $$
declare
  v_token text;
  v_utente public.user_credentials;
begin
  v_token := nullif(current_setting('request.headers', true)::json ->> 'x-kp-token', '');
  if v_token is null then
    return v_utente;          -- nessun token: riga vuota, nessun accesso
  end if;

  select u.* into v_utente
    from public.app_sessions s
    join public.user_credentials u on u.id = s.user_id
   where s.token = v_token::uuid
     and s.expires_at > now()
     and u.attivo = true;

  return v_utente;
exception when others then
  -- Un token malformato non deve far esplodere la query: vale come assente.
  return v_utente;
end;
$$;

create or replace function public.kp_nome()
returns text language sql stable
as $$ select (public.kp_sessione()).nome $$;

create or replace function public.kp_ruolo()
returns text language sql stable
as $$ select (public.kp_sessione()).ruolo $$;

grant execute on function public.kp_sessione() to anon, authenticated;
grant execute on function public.kp_nome()     to anon, authenticated;
grant execute on function public.kp_ruolo()    to anon, authenticated;
