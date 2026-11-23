-- APPLICATA il 2026-11-23.
--
-- RLS su sales e clienti, con l'identita' presa dal token di sessione
-- (vedi 20261123174059_identita_da_intestazione.sql).
--
-- La service_role scavalca tutto, quindi le 23 chiamate delle funzioni
-- serverless non cambiano. Il portale si identifica con l'intestazione
-- x-kp-token, che gia' manda a /api.
--
-- Provato: senza token sales e clienti rispondono 0 righe (erano 33 e 38),
-- con token admin 33 e 38, con token agente solo i propri.

alter table public.sales   enable row level security;
alter table public.clienti enable row level security;

-- ---- sales ---------------------------------------------------------------
drop policy if exists "sales lettura" on public.sales;
create policy "sales lettura" on public.sales for select to anon, authenticated
using (
  public.kp_ruolo() = 'admin'
  or (public.kp_ruolo() in ('agente','agente_admin')
      and (assegnato_a = public.kp_nome() or agente = public.kp_nome()))
  or (public.kp_ruolo() = 'segnalatore' and segnalatore = public.kp_nome())
);

drop policy if exists "sales inserimento" on public.sales;
create policy "sales inserimento" on public.sales for insert to anon, authenticated
with check (public.kp_nome() is not null);

drop policy if exists "sales modifica" on public.sales;
create policy "sales modifica" on public.sales for update to anon, authenticated
using (
  public.kp_ruolo() = 'admin'
  or assegnato_a = public.kp_nome() or agente = public.kp_nome()
  or segnalatore = public.kp_nome()
)
with check (public.kp_nome() is not null);

-- Cancellare una vendita e' distruttivo: solo chi amministra.
drop policy if exists "sales cancellazione" on public.sales;
create policy "sales cancellazione" on public.sales for delete to anon, authenticated
using (public.kp_ruolo() = 'admin');

-- ---- clienti -------------------------------------------------------------
drop policy if exists "clienti lettura" on public.clienti;
create policy "clienti lettura" on public.clienti for select to anon, authenticated
using (
  public.kp_ruolo() = 'admin'
  or created_by = public.kp_nome()
  or agente_riferimento = public.kp_nome()
  or assegnato_a = public.kp_nome()
);

drop policy if exists "clienti inserimento" on public.clienti;
create policy "clienti inserimento" on public.clienti for insert to anon, authenticated
with check (public.kp_nome() is not null);

drop policy if exists "clienti modifica" on public.clienti;
create policy "clienti modifica" on public.clienti for update to anon, authenticated
using (
  public.kp_ruolo() = 'admin'
  or created_by = public.kp_nome()
  or agente_riferimento = public.kp_nome()
  or assegnato_a = public.kp_nome()
)
with check (public.kp_nome() is not null);

drop policy if exists "clienti cancellazione" on public.clienti;
create policy "clienti cancellazione" on public.clienti for delete to anon, authenticated
using (public.kp_ruolo() = 'admin');

-- ---- la vista -------------------------------------------------------------
-- Gira coi permessi del proprietario e scavalca RLS: lasciarla aperta alla
-- chiave pubblica vanificherebbe tutto quanto sopra. Si chiude, e il portale
-- la legge attraverso una funzione che applica le stesse regole.
revoke select on public.sales_with_commissions from anon, authenticated;

create or replace function public.sales_visibili()
returns setof public.sales_with_commissions
language sql stable security definer
set search_path to 'public', 'extensions'
as $$
  select v.* from public.sales_with_commissions v
  where public.kp_nome() is not null
    and (
      public.kp_ruolo() = 'admin'
      or (public.kp_ruolo() in ('agente','agente_admin')
          and (v.assegnato_a = public.kp_nome() or v.agente = public.kp_nome()))
      or (public.kp_ruolo() = 'segnalatore' and v.segnalatore = public.kp_nome())
    )
  order by v.created_at desc
$$;

grant execute on function public.sales_visibili() to anon, authenticated;
