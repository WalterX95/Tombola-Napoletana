# 🎱 Tombola Napoletana – Il Gioco della Tradizione

![Tombola Napoletana Banner](https://via.placeholder.com/1200x500.png?text=Tombola+Napoletana+Online)

[![Node.js Version](https://img.shields.io/node/v/express.svg)](https://nodejs.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Status](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/)

Benvenuto nel repository della **Tombola Napoletana**, una moderna rivisitazione web del classico gioco natalizio partenopeo. Gioca con amici e parenti, sia in locale che online in tempo reale!

---

## ✨ Funzionalità Principali

Questa applicazione offre un'esperienza completa e coinvolgente, progettata con cura per rispecchiare l'atmosfera delle feste.

### 🏠 **Modalità Locale**
Divertiti tutti insieme sullo stesso dispositivo! Perfetto per le riunioni di famiglia o tra amici in presenza.

### 🌐 **Multiplayer Online** (Socket.IO)
Crea una stanza privata e invita chi vuoi, ovunque si trovi.
- **Creazione Stanza**: Genera un codice univoco per la tua partita.
- **Join Rapido**: Unisciti inserendo il codice stanza.
- **Gestore Partita (Host)**: Solo l'host può estrarre i numeri, garantendo ordine nel gioco.
- **Smorfia Napoletana**: Ogni numero estratto è accompagnato dalla sua tradizionale descrizione in dialetto/italiano!
- **Verifica Vincite**: Il sistema controlla e annuncia automaticamente Ambo, Terno, Quaterna, Cinquina e Tombola.

### 🎨 **Design Premium**
- Interfaccia utente curata con effetti **Glassmorphism**.
- Animazioni fluide per l'estrazione dei numeri e le vittorie.
- Font eleganti (*Cinzel* e *Outfit*) per un tocco di classe.
- Completamente **Responsive**: Gioca da PC, Tablet o Smartphone.

---

## 🛠️ Tecnologie Utilizzate

Il progetto è costruito con uno stack tecnologico moderno e leggero:

- **Frontend**:
  - HTML5 Semantico
  - CSS3 (Vanilla, con Flexbox/Grid e variabili CSS)
  - JavaScript (ES6+ Modules)
- **Backend**:
  - [Node.js](https://nodejs.org/) - Runtime JavaScript
  - [Express](https://expressjs.com/) - Framework web veloce e minimalista
  - [Socket.IO](https://socket.io/) - Comunicazione bidirezionale real-time

---

## 🚀 Installazione e Avvio

Segui questi passaggi per eseguire il gioco sul tuo computer locale.

### Prerequisiti
Assicurati di avere installato [Node.js](https://nodejs.org/) (versione 14 o superiore).

### 1. Clona il Repository
```bash
git clone https://github.com/IL-TUO-USERNAME/Tombola-Napoletana.git
cd Tombola-Napoletana
```

### 2. Installa le Dipendenze
```bash
npm install
```

### 3. Avvia il Server
Puoi avviare il server in modalità produzione o sviluppo:

```bash
# Avvio standard
npm start

# Oppure in modalità sviluppo (uguale a start in questo setup)
npm run dev
```

### 4. Gioca!
Apri il tuo browser preferito e visita:
`http://localhost:3000`

---

## 🌐 Deployment su Vercel

Questo progetto è configurato per essere distribuito facilmente su [Vercel](https://vercel.com/).

### Passaggi per il Deployment:
1. Carica il progetto su un repository GitHub.
2. Vai sulla dashboard di Vercel e clicca su **"Add New"** > **"Project"**.
3. Importa il repository della Tombola.
4. Vercel rileverà automaticamente la configurazione tramite il file `vercel.json`.
5. Clicca su **"Deploy"**.

> [!IMPORTANT]
> **Limitazioni Serverless**: Poiché Vercel utilizza Serverless Functions, le connessioni WebSocket di Socket.IO potrebbero non essere persistenti. La modalità locale funzionerà perfettamente, mentre quella online potrebbe risentire della natura stateless delle funzioni Vercel. Per un'esperienza multiplayer ottimale, si consiglia un hosting persistente come Railway o Render.

---

## 📂 Struttura del Progetto

Ecco una panoramica dei file principali:

```
Tombola-Napoletana/
├── css/                # Fogli di stile (style2.css, etc.)
├── js/                 # Logica Client-side
│   ├── index.js        # Script principale
│   └── smorfia/        # Dati della Smorfia (JSON)
├── img/                # Icone e immagini
├── index.html          # Home Page e Gioco
├── regole.html         # Pagina del regolamento
├── contatti.html       # Pagina contatti
├── server.js           # Server Node.js + Socket.IO logic
└── package.json        # Configurazione progetto e dipendenze
```

---

## 📜 Regole del Gioco

Le regole seguono la tradizione classica:
1. Ogni giocatore può acquistare 3, 6 o 9 cartelle.
2. L'host estrae i numeri da 1 a 90.
3. I giocatori segnano i numeri presenti sulle loro cartelle.
4. Si vince completando le combinazioni:
   - **Ambo**: 2 numeri sulla stessa riga.
   - **Terno**: 3 numeri sulla stessa riga.
   - **Quaterna**: 4 numeri sulla stessa riga.
   - **Cinquina**: 5 numeri sulla stessa riga.
   - **Tombola**: Tutti i numeri di una cartella.

Per maggiori dettagli, consulta la pagina [Regole](regole.html) integrata nel gioco.

---

## 🤝 Contribuire

I contributi sono benvenuti! Sentiti libero di aprire una **Issue** o inviare una **Pull Request** per migliorare il gioco, aggiungere nuove feature o correggere bug.

1. Fai un Fork del progetto
2. Crea il tuo Feature Branch (`git checkout -b feature/NuovaFeature`)
3. Fai il Commit delle modifiche (`git commit -m 'Aggiunta nuova feature'`)
4. Pusha sul Branch (`git push origin feature/NuovaFeature`)
5. Apri una Pull Request

---

## 📄 Licenza

Questo progetto è distribuito sotto licenza **ISC**. Vedi il file `package.json` o `LICENSE` per maggiori dettagli.

---

<p align="center">
  Realizzato con ❤️ e un pizzico di fortuna napoletana 🌶️
</p>
