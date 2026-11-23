# KeyPrime — memoria di lavoro

Appunti per chi riprende in mano questo codice. Non e' il manuale operativo
(quello e' `SETUP.md`, scritto per Pellegrino): qui ci sono le decisioni gia'
prese, le trappole che hanno gia' fatto perdere tempo, e cosa resta aperto.

## Com'e' fatto l'insieme

Due applicazioni, **un solo database Supabase** (`wqtylxrrerhbxagdzftn`):

| | Dove | Cos'e' |
|---|---|---|
| `keyprime-sales` | `portal.keyprimere.com` | Il gestionale interno. React 18 + CRA, un `src/App.js` monolitico in via di smontaggio |
| `keyprime-lead` | `www.keyprimere.com` | Il sito pubblico. Next.js 16 App Router |

Le funzioni serverless del portale stanno in `api/` (Vercel). `api/_lib/`
contiene gli aiutanti: `auth.mjs` (sessioni), `supabase.mjs`, `ghl.mjs`.

## Autenticazione: non e' Supabase Auth

Il portale ha il **suo** login: `app_login` emette un token UUID che vive in
`localStorage` e in `app_sessions`. Non esiste `auth.uid()`, quindi le policy
RLS non possono appoggiarsi a Supabase Auth.

Conseguenza pratica: tutto cio' che deve rispettare un permesso passa da
funzioni `SECURITY DEFINER` che prendono `p_token` come primo argomento e
chiamano `app_session_user(p_token)`. Lo schema e' quello di `app_settings_set`
— copiarlo, non inventarne un altro.

Lato serverless l'equivalente e' `requireSession(req, res, supabase, { ruoli })`
in `api/_lib/auth.mjs`, col token nell'intestazione `x-kp-token`.

## Sicurezza: due mondi

**Fatto bene** (tabelle nuove): `immobili` e `richieste` hanno RLS attivo, non
concedono niente ad `anon` tranne — per `immobili` — le righe con
`pubblicato = true`, perche' quella tabella la legge il sito pubblico con la
chiave anonima. Letture delle bozze e scritture passano dalle funzioni.

**Chiuso il 23/11** (era il debito piu' grosso): `sales` e `clienti` avevano
RLS disattivato e con la chiave `anon` — che sta nel bundle pubblico, la
scarica chiunque — si leggevano e si scrivevano. Ora hanno RLS con policy per
ruolo. `users`, `cliente_interazioni` ed `email_log` sono chiuse e basta:
nessuno le legge.

Come fa il database a sapere chi sta chiedendo, visto che non c'e'
`auth.uid()`: **PostgREST passa le intestazioni della richiesta a SQL**. Il
client mette il token di sessione in `x-kp-token` (vedi
`src/lib/supabaseClient.js`, che per questo passa da un `fetch` proprio: le
`global.headers` si fissano alla creazione, il token no), e
`kp_sessione()` / `kp_nome()` / `kp_ruolo()` lo leggono da
`current_setting('request.headers', true)::json`. Le policy si appoggiano a
quelle tre. Provato: senza token `sales` e `clienti` rispondono 0 righe (erano
33 e 38), con token admin 33 e 38, con token agente solo i propri.

**Le viste scavalcano RLS.** Una vista gira coi permessi di chi la possiede, non
di chi la interroga, a meno di `security_invoker`. Per questo
`sales_with_commissions` e `team_members` erano leggibili da chiunque anche con
RLS accesa sotto: `team_members` dava nome, email, username, telefono,
commissioni e ultimo accesso di tutti e dodici. Rimedio per entrambe: `revoke`
sulla vista e lettura da una funzione — `sales_visibili()` e `team_visibile()`.
Se nasce un'altra vista su dati del team, vale lo stesso.

Il taglio di `team_visibile()` e' voluto cosi': fra colleghi restano visibili
nome, ruolo, email, username, telefono (sono dodici persone che lavorano
insieme, e gli username sono `nome.cognome`); sono riservate ad admin, o alla
propria riga, le cose che un agente non deve sapere dei colleghi —
`commission_pct`, `last_login_at`, `must_change_password`, `ghl_user_id`.
Resta aperto che un membro loggato veda i recapiti dei colleghi: per toglierlo
bisogna spostare lato server le notifiche che oggi leggono l'email del
destinatario dal browser (`convertLeadToSale`, `updateSale`, `createTask`).

Le funzioni serverless non passano da qui: usano la `service_role`, che
scavalca RLS. Verificato il 23/11 che sia configurata su Vercel
(`/api/ghl/config` risponde `service_role_configurata: true`) — senza, si
fermerebbero tutte.

`api/proxy-image.js` era un proxy aperto (SSRF). Ora: solo https, niente
redirect, solo risposte immagine, e il nome si risolve per rifiutare gli
indirizzi privati. Non riaprirlo "per comodita'".

## Convenzioni

**Si scrive in italiano**: nomi di funzioni, variabili, commenti, messaggi.
Le eccezioni sono i nomi imposti da librerie (`useState`) e le colonne gia'
esistenti.

**Il prefisso `use`** lo pretende la regola dei hook di React. E' gia' costato
due build: `usaMovimento` e `usaPaginazione` non compilano.

**Colori**: solo da `src/lib/theme.js` e dalle classi rimappate in
`tailwind.config.js`. Le scale neutre sono **rovesciate di proposito**
(`zinc-800` e' chiaro). Regola che non si negozia: **l'oro pieno `#c9a84c` sta
a 2,29:1 col bianco** — non puo' portare testo bianco, ci va l'inchiostro
navy. Per scrivere in oro serve `#836a27`.

**Tailwind si compila al build.** Il CDN caricava il compilatore nel browser e
ricompilava a ogni cambio di classe: era meta' del costo di ogni interazione
(misurato). Non reintrodurlo.

## Come si verifica il lavoro

Non si dichiara fatto quello che non si e' visto. Il giro e':

```
CI=true npx react-scripts build      # CI=true tratta i warning come errori
# servire build/ su una porta, guidare con Playwright
# /opt/pw-browsers/chromium, playwright-core in /opt/node-tools/node_modules
```

Per entrare serve un utente: `__anteprima_tema__`. **Rito obbligatorio** —
si riaccende con una password nota, si fa la prova, e si rispegne subito con
`attivo = false` e una password casuale. Lasciarlo acceso e' un account agente
aperto su un indirizzo pubblico.

## Trappole che hanno gia' fatto perdere tempo

- **`Map` in `App.js` e' un'icona di lucide-react**, non la struttura dati.
  `new Map()` da' "Pr is not a constructor" e pagina bianca.
- **`innerText` restituisce il testo trasformato dal CSS**: cercare
  "Commissioni maturate" dove la pagina ha `text-transform: uppercase` non
  trova niente. Ha gia' prodotto un falso "manca meta' della dashboard".
- **In plpgsql `text[] || 'stringa'` non concatena**: tenta un cast e fallisce.
  Si usa `array_append`.
- **I merge con `main` fanno sempre conflitto** perche' le PR si uniscono in
  squash: il ramo ha i commit singoli, `main` la versione schiacciata. Si
  risolve con `--ours`, ma solo **dopo** aver verificato cosa si perde
  (`git diff origin/main -- file | grep '^-'`).
- **`build/` e `node_modules/` sono tracciati** in git. Prima di committare:
  `git checkout -- build node_modules`.
- **Lo strumento `execute_sql` di Supabase va in timeout** sui blocchi lunghi
  (`do $$ ... $$`, tabelle temporanee). Le istruzioni brevi passano. Conviene
  spezzare.

## Scelte di prodotto gia' prese

- **Un accento solo** (l'oro del marchio). Prima la UI usava dieci famiglie di
  colore in quasi cinquecento punti.
- **Niente numeri finti.** I riquadri non ancora attivi sulla home sono
  tratteggiati, marcati "In arrivo", e mostrano `— esempio: 42`. In un
  gestionale dove si vende davvero, "Contratti in scadenza: 3" manda un agente
  a cercare tre contratti che non esistono.
- **L'agente entra dal Riepilogo**, non dalla coda: la coda vuota e' una
  pagina bianca, il riepilogo ha sempre qualcosa.
- **L'agente non vede i dati dell'agenzia**: quote soci, netto KeyPrime,
  classifica dei colleghi. La separazione e' `vista = 'admin' | 'agente'` in
  `DashboardAdmin.js`.
- **Il portafoglio immobili e' condiviso** in lettura (tutto il pubblicato +
  le proprie bozze), ma si modifica solo il proprio. Lo decide il database.
- **`immobili.prezzo`** vuol dire prezzo di vendita **oppure canone annuo**
  per l'affitto: a Dubai l'affitto si quota per anno.
- **Un segnalatore puo' inserire un immobile, non pubblicarlo.**

## GoHighLevel: cosa si puo' fare da qui e cosa no

Location unica: `Yjm3Uvb0rc8mRuraj7ad` (company `TKb1V76Yu1nychT1uppg`).
L'accesso e' via connettore MCP, non via browser.

**Il limite che decide l'architettura**: l'API dei workflow risponde
`WORKFLOW_API_NOT_ENABLED_FOR_LOCATION`. Non e' un problema di token o di
scope — la funzione e' riservata a certi sotto-account. Quindi **ogni
automazione dentro GHL va costruita a mano nell'interfaccia**, e la regola
pratica e': tutto cio' che si puo' fare nel portale si fa nel portale, cosi'
il lavoro manuale in GHL resta un passo solo (il webhook di ingresso).

Non esiste nemmeno un'operazione per modificare le impostazioni della
location: **il fuso e' `Europe/Amsterdam` su un'agenzia di Dubai** e si
corregge solo a mano. Finche' resta cosi', le 9:00–18:00 di disponibilita'
dei calendari sono le 12:00–21:00 di Dubai. Verificato aprendo il widget:
primo slot alle 08:00 UTC.

Si puo' fare via API: utenti, calendari, contatti, opportunita', campi
personalizzati, tag, pipeline.

Creati il 2026-11-23:

| | id utente | calendario | link |
|---|---|---|---|
| Giovanni Aguit | `pBNgGBRKnfoMNCIdVMSN` | `iIsN5XdyoXVIaRXYw4Oj` | `/widget/bookings/giovanni-aguit` |
| Alessandro Banfi | `T78lJ6xvDeJX0poCREKJ` | `mxq1GwJzJEorNbP2wMfo` | `/widget/bookings/alessandro-banfi` |

Base dei link: `https://api.leadconnectorhq.com`. Entrambi ruolo `user` con
`assignedDataOnly`, cioe' vedono solo i propri dati — la stessa separazione
che fa RLS nel portale. I due id e i due link stanno in `user_credentials`
(`ghl_user_id`, `ghl_calendario_url`): la mail di conferma al lead pesca il
link da li', quindi cambiare agente in rotazione non richiede toccare codice.

**La posta ai clienti esce da GHL, non da Resend.** `mail.keyprimere.com` e'
gia' un dominio verificato sulla location. Resend resta per il portale
(avvisi agli agenti, promemoria) e come ripiego se GHL fallisce — quando
scatta si vede in `ghl_sync_log` come `conferma_lead_ripiego_resend`. Il
motivo e' il volume: le mail ai lead crescono con le campagne, quelle interne
no. In piu' la mail spedita da GHL resta attaccata alla conversazione del
contatto, quindi una risposta non si perde.

**Una pipeline sola per tutti**: `OKvPvoWtJKRZQx5kM20n` — "Pipeline Lead
KeyPrime", stadio di ingresso "Da contattare"
`016c2631-fe68-42a3-9afd-73c64e9d06cb`. Gli id stanno sull'anagrafica
(`ghl_pipeline_id`, `ghl_stadio_iniziale_id`).

Stadi: Da contattare, Call fissata, Qualificato, Proposta inviata, Trattativa,
Chiuso. Quando la rotazione assegna un lead nasce l'opportunita' li' dentro, e
il contatto passa in carico all'agente anche in GHL — senza, lui apre GHL e
non vede niente, perche' gira con `assignedDataOnly`.

Erano nate due pipeline separate, una per agente, poi accorpate: con
`assignedDataOnly` ciascuno vede comunque solo i propri, quindi la
separazione c'e' lo stesso e in piu' resta una lavagna unica per chi
amministra. Due pipeline avrebbero voluto dire due board da guardare, e tre
al terzo agente.

**Quello che in questa location NON c'e'** (verificato il 23/11, non dedotto):

- **nessun numero di telefono**: `active-numbers` risponde `No Twilio account
  found for location`. Senza numero non partono SMS, e WhatsApp non ha canale.
- **nessun agente AI**: `list-managed-agents` risponde zero.
- **i moduli si leggono ma non si creano**: l'API offre `get-forms` e
  `get-forms-submissions`, nessuna scrittura. Ne esiste uno solo, "Form 1
  landing keyprime" (`AiobyCSmW3Wb3FNWQIQ2`), quello dei lead Meta di giugno.
- le landing delle campagne (`uae.keyprimere.com`) sono **funnel GHL**, non il
  Next.js di `keyprime-lead`: confermato dagli header `x-ghl-serve-region`.

Quindi la catena "WhatsApp qualifica e prenota la call" oggi non ha dove
appoggiarsi, e i moduli nuovi vanno fatti nell'interfaccia.

**L'indice di ricerca di GHL e' in ritardo sulla scrittura.** Un contatto
appena creato non compare subito in `/contacts/search`: misurato, il primo
giro trovava zero e quello dopo lo trovava. Non e' un bug del nostro codice.
Il giro ogni due minuti lo copre da solo, ma non fidarsi di una singola
chiamata subito dopo una creazione.

Trappola gia' incontrata: `openHours` vuole **una voce per giorno**
(`daysOfTheWeek: [1]`, poi `[2]`...). Passare `[1,2,3,4,5]` in una sola voce
da' `must be a valid day of week`.

## Cosa resta aperto

1. **Notifiche che leggono i recapiti dal browser** (sopra): finche' ci sono,
   un membro loggato vede le email dei colleghi. Si chiude spostando la
   risoluzione del destinatario dentro `/api/send-email` e `/api/send-push`,
   che hanno gia' sessione e `service_role`.
2. **`richieste`**: tabella creata, **funzioni di lettura/scrittura mancanti**
   (migrazione interrotta da un timeout). Senza quelle la tabella e' inerte.
3. **Catena pubblicazione → vetrina** mai provata da capo a fondo: serve un
   immobile vero, perche' uno finto finirebbe sul sito pubblico.
4. **Riquadri ancora segnaposto**: Posta, Contratti in scadenza, Nuovo
   appuntamento. Servono le entita' corrispondenti.
5. **`/api/request-info`** (sito pubblico) manda il lead solo a GHL, non a
   `lead_registrations`: se il rientro da GHL non e' attivo, nell'Inbox del
   portale non compare.
6. **Token GHL** passato in chat: da rigenerare.
6-bis. **Il workflow di ingresso in GHL non esiste ancora.** Finche' non c'e',
   nessun lead di campagna arriva nel portale: il resto della catena
   (dedupe, rotazione, SLA, mail di conferma) e' pronto e provato, ma non
   viene mai chiamato. Trigger sul contatto creato, azione Webhook POST a
   `https://portal.keyprimere.com/api/ghl/webhook`, header `x-kp-secret`.
6-ter. **Fuso della location** da correggere a mano (sopra).
7. **Dati sporchi** segnalati e mai corretti: un lead a valore `-2`, una zona
   senza nome da 7M, nessun telefono in anagrafica Team (0 su 12), email solo
   per 5 su 12. E **Alessandro Banfi ha `commission_pct = 0`**: non e' un
   valore mancante, e' uno zero, quindi `percentualeAgente` non ripiega sul
   70% di default e gli calcola commissione nulla.
8. **Dati del Calcolatore ROI** fermi al 2024-2025, e le zone di Fujairah sono
   dichiarate stime.
