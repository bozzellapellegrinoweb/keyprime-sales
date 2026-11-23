-- APPLICATA il 2026-11-23.
--
-- La rotazione gira su chi decidi tu, non su chiunque sia attivo.
--
-- Prima prendeva tutti gli utenti con ruolo agente o agente_admin: oggi
-- sarebbero quattro, e due di loro non lavorano i lead (Sara Tufo non e' mai
-- entrata). Un lead assegnato a chi non lo guarda e' un lead perso meglio
-- nascosto.
--
-- L'elenco sta in app_settings.round_robin.agenti, non nel codice: si cambia
-- dalle Impostazioni quando entra o esce qualcuno, senza una pubblicazione.
-- Se l'elenco manca o e' vuoto si torna al comportamento di prima, cosi' una
-- configurazione incompleta non blocca l'assegnazione.
--
-- Aggiunto anche l'aggiornamento di clienti.assegnato_a: prima restava
-- indietro, e la scheda del cliente mostrava un agente diverso dal lead.
create or replace function public.app_assign_round_robin(p_sale_id bigint, p_eseguito_da text default 'sistema')
returns json
language plpgsql security definer
set search_path to 'public'
as $function$
declare
  v_agenti    text[];
  v_scelti    text[];
  v_idx       int;
  v_scelto    text;
  v_attivo    boolean;
  v_precedente text;
  v_cliente   bigint;
begin
  select coalesce((value->>'attivo')::boolean, true),
         coalesce((value->>'ultimo_indice')::int, -1),
         coalesce(
           (select array_agg(x) from jsonb_array_elements_text(
              case when jsonb_typeof(value->'agenti') = 'array'
                   then value->'agenti' else '[]'::jsonb end) as x),
           '{}'::text[])
    into v_attivo, v_idx, v_scelti
    from public.app_settings where key = 'round_robin' for update;

  if v_attivo is distinct from true then
    return json_build_object('ok', false, 'error', 'Round-robin disattivato');
  end if;

  -- Si parte dai nomi scelti, ma passano solo quelli ancora attivi: un agente
  -- disattivato esce dal giro da solo, senza che nessuno si ricordi di
  -- toglierlo dall'elenco.
  if array_length(v_scelti, 1) > 0 then
    select array_agg(nome order by id) into v_agenti
      from public.user_credentials
     where attivo = true and ruolo in ('agente', 'agente_admin')
       and nome = any(v_scelti);
  end if;

  if v_agenti is null or array_length(v_agenti, 1) = 0 then
    select array_agg(nome order by id) into v_agenti
      from public.user_credentials
     where attivo = true and ruolo in ('agente', 'agente_admin');
  end if;

  if v_agenti is null or array_length(v_agenti, 1) = 0 then
    return json_build_object('ok', false, 'error', 'Nessun agente attivo in rotazione');
  end if;

  v_idx := (v_idx + 1) % array_length(v_agenti, 1);
  v_scelto := v_agenti[v_idx + 1];

  update public.app_settings
     set value = jsonb_set(value, '{ultimo_indice}', to_jsonb(v_idx)), updated_at = now()
   where key = 'round_robin';

  select assegnato_a, cliente_id into v_precedente, v_cliente
    from public.sales where id = p_sale_id;

  update public.sales
     set assegnato_a = v_scelto,
         agente = coalesce(nullif(agente, ''), v_scelto)
   where id = p_sale_id;

  if v_cliente is not null then
    update public.clienti
       set assegnato_a = v_scelto,
           agente_riferimento = coalesce(nullif(agente_riferimento, ''), v_scelto)
     where id = v_cliente;
  end if;

  insert into public.lead_assignment_log (sale_id, cliente_id, da_agente, a_agente, modalita, eseguito_da)
  values (p_sale_id, v_cliente, v_precedente, v_scelto, 'round-robin', p_eseguito_da);

  return json_build_object('ok', true, 'agente', v_scelto, 'in_rotazione', array_length(v_agenti, 1));
end;
$function$;
