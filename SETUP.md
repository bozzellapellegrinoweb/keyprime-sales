# KeyPrime Portal — messa in servizio

Questa guida serve una volta sola, dopo il deploy di queste modifiche.
Le voci marcate **obbligatorio** vanno fatte subito: senza, alcune funzioni che
prima andavano smettono di funzionare, perché le chiavi non sono più nel codice.

---

## 1. Variabili ambiente su Vercel — obbligatorio

Vercel → progetto → **Settings → Environment Variables**.
Le chiavi erano scritte dentro i file del repository (quindi leggibili da
chiunque avesse accesso al codice, e presenti nella storia di git). Ora il
codice le legge da qui.

| Variabile | A cosa serve | Dove la trovi |
|---|---|---|
| `RESEND_API_KEY` | **Serve** per le email | Resend → API Keys |
| `GHL_API_KEY` | **Serve** per GoHighLevel | Private Integration Token della location |
| `GHL_LOCATION_ID` | **Serve** per GoHighLevel | l'id nell'URL della sub-account |
| `GHL_WEBHOOK_SECRET` | **Serve** per i lead in ingresso | stringa lunga a tua scelta |
| `ONESIGNAL_REST_API_KEY` | Notifiche push | OneSignal → Settings → Keys & IDs (già presente) |
| `PF_API_KEY` | Sync notturno dei progetti off-plan | RapidAPI |
| `ANTHROPIC_API_KEY` | Generazione descrizioni nelle offerte | già presente |
| `KP_JOB_SECRET` | Solo per lanciare a mano il job dei promemoria | inventane una lunga |
| `SUPABASE_SERVICE_ROLE_KEY` | **Facoltativa.** Gli endpoint funzionano senza | Supabase → Settings → API |
| `ADMIN_EMAIL` | Destinatario dei riepiloghi | già impostata |
| `APP_URL` | Link nelle notifiche | già impostata |

> La `service_role` **non è più necessaria**. Gli endpoint usano la chiave
> pubblica — la stessa che gira nel bundle del portale — e fanno passare le
> operazioni delicate da funzioni `SECURITY DEFINER` sul database, che non
> espongono mai gli hash delle password. Se la configuri viene usata, ma
> niente si rompe se manca.

> **Le chiavi erano nel repository in chiaro** e vanno sostituite, ma non tutte
> allo stesso modo:
>
> - **Resend e RapidAPI**: rigenerale e basta, non rompono nulla.
> - **Supabase `service_role`**: ora che non serve più, la cosa più pulita è
>   non configurarla affatto. Se un giorno vuoi comunque ruotarla, sappi che
>   non è un'operazione isolata: su Supabase si rigenera il JWT secret, che
>   cambia *anche* la chiave pubblica `anon`. Quella è scritta in
>   `src/lib/supabaseClient.js`, quindi la
>   rotazione va fatta insieme a una modifica del codice e a un nuovo deploy,
>   altrimenti il portale smette di collegarsi al database. Pianificatela a
>   parte.

Il file `.env.example` elenca tutte le variabili con le note.

---

## 2. Collegamento GoHighLevel

### 2.1 Token (da fare su Vercel, non nel portale)

In GHL: **Settings → Private Integrations → Create new integration**.

Scope da attivare:

```
contacts.readonly        contacts.write
conversations.readonly   conversations.write
conversations/message.write
opportunities.readonly   opportunities.write
workflows.readonly
```

Poi su Vercel:

| Variabile | Valore |
|---|---|
| `GHL_API_KEY` | il Private Integration Token |
| `GHL_LOCATION_ID` | l'ID della sub-account KeyPrime (GHL → Settings → Business Profile) |
| `GHL_WEBHOOK_SECRET` | una stringa lunga che scegli tu (serve al punto 2.3) |

### 2.2 Pipeline e sequenze (dal portale)

Portale → **Impostazioni** → *Verifica*.

Il portale interroga GHL e mostra pipeline, stage e workflow trovati. Da lì:

- scegli la pipeline KeyPrime e abbina ogni stage allo stato interno
  (Lead, Trattativa, EOI, Venduto, Incassato);
- collega le sequenze di nurturing ai workflow GHL;
- salva.

Se la verifica fallisce, il pannello mostra la risposta esatta di GHL: nove
volte su dieci è uno scope mancante.

Senza mappatura della pipeline l'integrazione funziona comunque: il portale
applica i tag (`kp-lead`, `kp-trattativa`, ...) e le automazioni GHL possono
reagire a quelli.

### 2.3 Lead in ingresso

In GHL, nel workflow che raccoglie i lead (form, ads, landing), aggiungi
un'azione **Webhook**:

- Metodo: `POST`
- URL: `https://portal.keyprimere.com/api/ghl/webhook`
- Header: `x-kp-secret` = il valore di `GHL_WEBHOOK_SECRET`

Alla ricezione il portale, in ordine: riconosce il cliente (per id GHL, email o
telefono) o lo crea, apre il lead, lo assegna a rotazione, programma il primo
follow-up secondo lo SLA e avvisa l'agente con push ed email.

Il payload viene letto in modo tollerante: `firstName`/`first_name`/`full_name`,
`phone`, `email`, `source`, più i campi personalizzati `zona`, `progetto`,
`budget`, `message`. Ogni chiamata, riuscita o no, finisce in `ghl_sync_log`
con la risposta completa di GHL.

---

## 3. Promemoria follow-up

Gira da solo come cron Vercel (`vercel.json`), ogni giorno alle 06:37 UTC.
Ogni agente riceve **un solo** avviso con: follow-up in ritardo, quelli di oggi,
lead mai contattati oltre SLA e lead fermi. All'admin arriva il riepilogo del
team e l'elenco dei lead senza proprietario.

Prova manuale:

```bash
curl -X POST "https://portal.keyprimere.com/api/followup-reminders" \
  -H "x-kp-secret: <KP_JOB_SECRET>"
```

I tempi si regolano dal portale in **Impostazioni → Tempi di reazione**.

---

## 4. Inserire i 3 nuovi sales

Portale → **Team → Nuovo accesso**.

- Compila nome, email (serve per i promemoria), telefono e username.
- La password iniziale viene generata; puoi cambiarla.
- Ruolo **Agente** se deve lavorare lead e prendere commissione; **Segnalatore**
  se porta solo nominativi.
- **Commissione agente**: lascia vuoto per il 70% standard, oppure scrivi una
  percentuale diversa per quella persona.
- Dopo il salvataggio compare la schermata con le credenziali da consegnare:
  **copiale subito**, nel database resta solo l'hash e non sono più
  recuperabili.
- Al primo accesso l'agente deve scegliere una password sua.

Chi entra come **Agente** finisce automaticamente nella rotazione dei lead
inbound. Chi lascia l'agenzia si **disattiva** (non si cancella), così vendite
e commissioni restano attribuite a lui.

---

## 4bis. Recapiti degli agenti — da compilare

Il PDF dell'offerta stampa, in copertina e su ogni scheda immobile, **nome,
email e telefono dell'agente che la firma**. Se la scheda della persona è
vuota, il cliente riceve un prospetto a cui non può rispondere.

Oggi, in **Team**, nessuno ha il telefono e quattro persone su otto non hanno
nemmeno l'email (Pellegrino, Giovanni, Giuseppe, Domenico). Vanno compilati:
**Team → apri la persona → Email / Telefono → Salva**.

Da lì in avanti ogni nuova offerta li porta già precompilati, e anche le
offerte vecchie — salvate senza recapiti — li recuperano dalla scheda al
momento della stampa. L'agente può comunque sovrascriverli sulla singola
offerta (utile per un numero dedicato a un cliente).

---

## 5. Pulizia residua — da fare a mano

Due cose non le ho potute chiudere da qui: il gestore del database usato in
questa sessione blocca le istruzioni distruttive (`DROP`, `DELETE`).

Supabase → SQL Editor:

```sql
-- 1. La colonna password non serve più: è già vuota e annullabile,
--    ma tanto vale toglierla.
alter table public.user_credentials drop column if exists password;

-- 2. Utenti e lead creati solo per collaudare login, rotazione e follow-up.
--    Sono gia' disattivati e rinominati "DA ELIMINARE"; questo li toglie.
delete from public.user_credentials
where username in ('__selftest__', '__selftest_agente__', '__collaudo__');

-- Il lead di prova porta con se' follow-up e attivita' create nel collaudo
-- (le chiavi esterne sono in cascata).
delete from public.sales where progetto = '__TEST ROTAZIONE - eliminabile__';
```

---

## 6. Utenti di collaudo rimasti

Tre utenti usati per le verifiche (`__selftest__`, `__selftest_agente__`,
`__collaudo__`) sono **disattivati** e rinominati "DA ELIMINARE": non possono
accedere e non compaiono nelle rotazioni. Restano visibili nella scheda Team
finché non esegui la query del punto 5.

---

## 7. Quello che resta aperto

**Autorizzazioni a livello database.** Credenziali e sessioni sono chiuse: con
la chiave pubblica dell'app non si leggono più password né token. Ma `sales`,
`clienti`, `tasks` e le altre tabelle hanno ancora policy permissive: chi
estrae la chiave pubblica dal bundle può leggerle e modificarle. Chiuderlo
davvero richiede di spostare l'autenticazione su Supabase Auth e scrivere le
policy per ruolo — è il passo che avevamo messo come secondo tempo.

**`node_modules` nel repository.** Sono 42.686 file committati. Non rompe
niente (Vercel esegue `npm install`), ma appesantisce il repo e ogni clone.
Si toglie con `git rm -r --cached node_modules`.
