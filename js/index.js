import { OpenModal, CloseModal } from "./modal/modal.js";
import {
    generateCartella,
    renderCartella,
    createCartellaState,
    markNumber,
    markCellInDOM,
    addWinBadge,
} from "./game.js";
import { initOnlineUI } from "./online.js";

// ============================================================
//  LOG UTILITY
// ============================================================
export function msg(text, type) {
    switch (type) {
        case 'error': console.error(text); break;
        case 'warning': console.warn(text); break;
        case 'info': console.info(text); break;
        default: console.log(text);
    }
}

// ============================================================
//  DOM REFERENCES – LOCALE
// ============================================================
const btnInitGame = document.getElementById("new-game");
const btnCloseModal = document.getElementById("close-new-game-modal");
const btnStartGame = document.getElementById("confirm-new-game");
const gameSection = document.getElementById("game-section");
const lobbySection = document.getElementById("lobby-section");
const numPlayersInput = document.getElementById("num-players");
const numSchedeSelect = document.getElementById("num-schede");
const draftNumberBtn = document.getElementById("draw-number-button");
const numberExtractEl = document.getElementById("drawn-number");
const drawnNumbersList = document.getElementById("drawn-numbers-list");
const playersContainer = document.getElementById("players-container");
const winModal = document.getElementById("win-modal");
const winModalMsg = document.getElementById("win-modal-message");
const btnCloseWinModal = document.getElementById("close-win-modal");

// ============================================================
//  SMORFIA
// ============================================================
let smorfia = {};

async function loadSmorfia() {
    try {
        const response = await fetch('./js/smorfia/smorfia.json');
        smorfia = await response.json();
        msg("Smorfia caricata.", "info");
    } catch (error) {
        msg("Errore caricamento Smorfia: " + error, "error");
    }
}
loadSmorfia();

// ============================================================
//  STATO PARTITA LOCALE
// ============================================================
let drawnNumbers = [];
let remainingNumbers = [];
let playerStates = [];
let playerElements = [];
let gameActive = false;
let tombolaWon = false;

// ============================================================
//  INIZIALIZZAZIONE
// ============================================================
window.addEventListener("DOMContentLoaded", () => {
    // Avvia UI online (lobby + socket)
    initOnlineUI();

    // Chiudi il modal locale all'avvio
    const newGameModal = document.getElementById("new-game-modal");
    if (newGameModal) newGameModal.style.display = "none";
});


// ============================================================
//  NAVBAR – "Nuova Partita" → torna alla lobby
// ============================================================
btnInitGame?.addEventListener("click", (e) => {
    e.preventDefault();
    // Nascondi gioco, mostra lobby
    gameSection.style.display = "none";
    document.getElementById("online-game-section").style.display = "none";
    lobbySection.style.display = "block";
    // Torna alla scelta modalità
    document.getElementById("mode-choice").style.display = "flex";
    document.getElementById("online-lobby").style.display = "none";
    document.getElementById("waiting-room").style.display = "none";
});

// ============================================================
//  MODAL LOCALE – CHIUDI
// ============================================================
btnCloseModal?.addEventListener("click", () => {
    CloseModal("new-game-modal");
});

// ============================================================
//  AVVIO PARTITA LOCALE
// ============================================================
btnStartGame?.addEventListener("click", () => {
    const numPlayers = parseInt(numPlayersInput.value, 10);
    const schedeValue = numSchedeSelect.value;
    const numSchede = parseInt(schedeValue.replace("num-", ""), 10);

    if (isNaN(numPlayers) || numPlayers < 1 || numPlayers > 10) {
        alert("Inserisci un numero di giocatori valido (1-10).");
        return;
    }

    // Reset
    drawnNumbers = [];
    remainingNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
    playerStates = [];
    playerElements = [];
    gameActive = true;
    tombolaWon = false;

    numberExtractEl.textContent = "--";
    drawnNumbersList.innerHTML = "";
    playersContainer.innerHTML = "";
    draftNumberBtn.disabled = false;

    // Genera giocatori e cartelle
    for (let p = 0; p < numPlayers; p++) {
        const statesArr = [];
        const elementsArr = [];

        const playerCard = document.createElement("div");
        playerCard.classList.add("player-card");
        playerCard.id = `player-${p}`;

        const playerTitle = document.createElement("h3");
        playerTitle.textContent = `Giocatore ${p + 1}`;
        playerCard.appendChild(playerTitle);

        const cartelleContainer = document.createElement("div");
        cartelleContainer.classList.add("cartelle-container");

        for (let s = 0; s < numSchede; s++) {
            const grid = generateCartella();
            const state = createCartellaState(grid);
            const cartellaEl = renderCartella(grid, p, s);

            statesArr.push(state);
            elementsArr.push(cartellaEl);
            cartelleContainer.appendChild(cartellaEl);
        }

        playerCard.appendChild(cartelleContainer);
        playersContainer.appendChild(playerCard);
        playerStates.push(statesArr);
        playerElements.push(elementsArr);
    }

    // Nascondi lobby, mostra gioco
    lobbySection.style.display = "none";
    gameSection.style.display = "flex";
    CloseModal("new-game-modal");
    msg("Partita locale avviata!", "info");
});

// ============================================================
//  ESTRAZIONE NUMERO LOCALE
// ============================================================
draftNumberBtn?.addEventListener("click", () => {
    if (!gameActive || tombolaWon) return;
    if (remainingNumbers.length === 0) {
        draftNumberBtn.disabled = true;
        return;
    }

    const idx = Math.floor(Math.random() * remainingNumbers.length);
    const number = remainingNumbers.splice(idx, 1)[0];
    drawnNumbers.push(number);

    const phrase = smorfia[number] || "";

    numberExtractEl.innerHTML = `
        <span class="drawn-num-big">${number}</span>
        <span class="drawn-num-phrase">${phrase}</span>
    `;

    const li = document.createElement("li");
    li.textContent = number;
    li.classList.add("drawn-pill");
    drawnNumbersList.appendChild(li);

    // Segna sulle cartelle
    let newWinsThisRound = [];
    playerStates.forEach((playerSchede, pIdx) => {
        playerSchede.forEach((state, sIdx) => {
            const wins = markNumber(state, number);
            markCellInDOM(playerElements[pIdx][sIdx], number);
            wins.forEach(win => {
                addWinBadge(playerElements[pIdx][sIdx], win.type);
                newWinsThisRound.push({ player: pIdx + 1, win });
            });
        });
    });

    if (newWinsThisRound.length > 0) {
        const order = ['ambo', 'terno', 'quaterna', 'cinquina', 'tombola'];
        const topWin = newWinsThisRound.reduce((best, curr) =>
            order.indexOf(curr.win.type) > order.indexOf(best.win.type) ? curr : best
        );
        showWinNotification(topWin);
        if (topWin.win.type === 'tombola') {
            tombolaWon = true;
            gameActive = false;
            draftNumberBtn.disabled = true;
        }
    }

    if (remainingNumbers.length === 0) draftNumberBtn.disabled = true;
});

// ============================================================
//  NOTIFICA VINCITA LOCALE
// ============================================================
function showWinNotification({ player, win }) {
    const labels = {
        ambo: "🎉 AMBO!",
        terno: "🎊 TERNO!",
        quaterna: "✨ QUATERNA!",
        cinquina: "🔥 CINQUINA!",
        tombola: "🏆 TOMBOLA!",
    };
    winModalMsg.innerHTML = `
        <div class="win-type-label">${labels[win.type]}</div>
        <div class="win-player-label">Giocatore ${player}</div>
    `;
    winModal.classList.add("visible");
    if (win.type !== 'tombola') {
        setTimeout(() => winModal.classList.remove("visible"), 3000);
    }
}

btnCloseWinModal?.addEventListener("click", () => {
    winModal.classList.remove("visible");
});

// ============================================================
//  LOG CAMBI INPUT
// ============================================================
numPlayersInput?.addEventListener("change", () => {
    msg("Giocatori: " + numPlayersInput.value, "info");
});
numSchedeSelect?.addEventListener("change", () => {
    msg("Schede: " + numSchedeSelect.value, "info");
});
