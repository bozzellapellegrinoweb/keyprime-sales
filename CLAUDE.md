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

**Debito aperto** (tabelle storiche): `clienti`, `sales`, `users`,
`cliente_interazioni`, `email_log` hanno **RLS disattivato**. Con la chiave
`anon` — che sta nel bundle pubblico, la scarica chiunque — si leggono e si
scrivono. Verificato: `clienti` risponde con 36 righe.

Non si chiude accendendo RLS: l'app legge quelle tabelle proprio con quella
chiave e si spegnerebbe. Va rifatto il giro delle letture (funzioni, o un
endpoint serverless con la service_role). E' un lavoro a se'.

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

## Cosa resta aperto

1. **RLS sulle tabelle storiche** (sopra). La cosa piu' seria.
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
7. **Dati sporchi** segnalati e mai corretti: un lead a valore `-2`, una zona
   senza nome da 7M, nessun telefono in anagrafica Team.
8. **Dati del Calcolatore ROI** fermi al 2024-2025, e le zone di Fujairah sono
   dichiarate stime.
