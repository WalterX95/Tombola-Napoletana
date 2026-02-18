// ============================================================
//  online.js – Client Socket.IO per Tombola Multiplayer
// ============================================================

import {
    generateCartella,
    renderCartella,
    createCartellaState,
    markNumber,
    markCellInDOM,
    addWinBadge,
} from './game.js';

// ============================================================
//  SOCKET
// ============================================================
// Socket.IO viene caricato come script globale dall'HTML
const socket = window.io();

// ============================================================
//  STATO LOCALE
// ============================================================
let mySocketId = null;
let isHost = false;
let currentRoom = null;
let playerName = '';
let numSchede = 3;

// Stato cartelle (solo le mie)
let myStates = [];   // createCartellaState[]
let myElements = [];   // HTMLElement[]

// Numeri estratti
let drawnNumbers = [];

// ============================================================
//  DOM REFERENCES (lobby + online)
// ============================================================
const lobbySection = document.getElementById('lobby-section');
const onlineGameSection = document.getElementById('online-game-section');

// Lobby – scelta modalità
const btnModeLocal = document.getElementById('btn-mode-local');
const btnModeOnline = document.getElementById('btn-mode-online');
const modeChoice = document.getElementById('mode-choice');
const onlineLobby = document.getElementById('online-lobby');

// Lobby – form
const inputPlayerName = document.getElementById('input-player-name');
const inputRoomCode = document.getElementById('input-room-code');
const btnCreateRoom = document.getElementById('btn-create-room');
const btnJoinRoom = document.getElementById('btn-join-room');
const lobbyError = document.getElementById('lobby-error');

// Sala d'attesa
const waitingRoom = document.getElementById('waiting-room');
const waitingRoomCode = document.getElementById('waiting-room-code');
const waitingPlayerList = document.getElementById('waiting-player-list');
const btnStartOnline = document.getElementById('btn-start-online');
const waitingStatus = document.getElementById('waiting-status');

// Gioco online
const onlineDrawnNumber = document.getElementById('online-drawn-number');
const onlineDrawnPhrase = document.getElementById('online-drawn-phrase');
const btnOnlineDraw = document.getElementById('btn-online-draw');
const onlinePlayersContainer = document.getElementById('online-players-container');
const onlineDrawnList = document.getElementById('online-drawn-list');
const onlineNumSchede = document.getElementById('online-num-schede');

// Win modal (riuso quello esistente)
const winModal = document.getElementById('win-modal');
const winModalMsg = document.getElementById('win-modal-message');
const btnCloseWin = document.getElementById('close-win-modal');

// ============================================================
//  HELPERS UI
// ============================================================
function showError(msg) {
    lobbyError.textContent = msg;
    lobbyError.style.display = 'block';
    setTimeout(() => { lobbyError.style.display = 'none'; }, 4000);
}

function showSection(section) {
    // Nascondi tutti i pannelli interni alla lobby
    [modeChoice, onlineLobby, waitingRoom].forEach(s => {
        if (s) s.style.display = 'none';
    });

    if (section === onlineGameSection) {
        // Gioco online: nascondi lobby, mostra sezione gioco
        lobbySection.style.display = 'none';
        onlineGameSection.style.display = 'flex';
        // Mostra la lista numeri online, nascondi quella locale
        document.getElementById('online-drawn-list').style.display = 'flex';
        document.getElementById('drawn-numbers-list').style.display = 'none';
    } else {
        // Pannello lobby: assicurati che lobby-section sia visibile
        lobbySection.style.display = 'flex';
        onlineGameSection.style.display = 'none';
        if (section) {
            section.style.display = 'flex';
            // Scrolla in cima per garantire visibilità del codice stanza
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
}

function copyRoomCode() {
    const code = currentRoom?.code;
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('btn-copy-code');
        if (btn) {
            btn.textContent = '✅';
            setTimeout(() => { btn.textContent = '📋'; }, 1800);
        }
    }).catch(() => {
        const badge = document.getElementById('waiting-room-code');
        if (badge) {
            const range = document.createRange();
            range.selectNode(badge);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
        }
    });
}

function renderWaitingPlayers(players) {
    waitingPlayerList.innerHTML = '';
    players.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p.name;
        if (p.id === mySocketId) li.classList.add('me');
        if (p.id === currentRoom?.host) {
            const crown = document.createElement('span');
            crown.textContent = ' 👑';
            li.appendChild(crown);
        }
        waitingPlayerList.appendChild(li);
    });
}

// ============================================================
//  SCELTA MODALITÀ
// ============================================================
export function initOnlineUI() {
    // Mostra la scelta modalità nella lobby
    showSection(modeChoice);

    btnModeLocal?.addEventListener('click', () => {
        // Torna al flusso locale (index.js gestisce il resto)
        lobbySection.style.display = 'none';
        document.getElementById('new-game-modal').style.display = 'flex';
    });

    btnModeOnline?.addEventListener('click', () => {
        showSection(onlineLobby);
    });

    // --------------------------------------------------------
    //  CREA STANZA
    // --------------------------------------------------------
    btnCreateRoom?.addEventListener('click', () => {
        playerName = inputPlayerName.value.trim() || 'Giocatore';
        numSchede = parseInt(onlineNumSchede?.value || '3', 10);
        socket.emit('create_room', { playerName, numSchede });
    });

    // --------------------------------------------------------
    //  UNISCITI A STANZA
    // --------------------------------------------------------
    btnJoinRoom?.addEventListener('click', () => {
        playerName = inputPlayerName.value.trim() || 'Giocatore';
        const code = inputRoomCode.value.trim().toUpperCase();
        if (!code) { showError('Inserisci il codice stanza.'); return; }
        socket.emit('join_room', { roomCode: code, playerName });
    });

    // --------------------------------------------------------
    //  AVVIA PARTITA (solo host)
    // --------------------------------------------------------
    btnStartOnline?.addEventListener('click', () => {
        if (!isHost || !currentRoom) return;
        socket.emit('start_game', { roomCode: currentRoom.code });
    });

    // --------------------------------------------------------
    //  ESTRAI NUMERO (solo host)
    // --------------------------------------------------------
    btnOnlineDraw?.addEventListener('click', () => {
        if (!isHost || !currentRoom) return;
        socket.emit('draw_number', { roomCode: currentRoom.code });
    });

    // --------------------------------------------------------
    //  CHIUDI WIN MODAL
    // --------------------------------------------------------
    btnCloseWin?.addEventListener('click', () => {
        winModal.classList.remove('visible');
    });

    // --------------------------------------------------------
    //  COPIA CODICE STANZA
    // --------------------------------------------------------
    const btnCopyCode = document.getElementById('btn-copy-code');
    btnCopyCode?.addEventListener('click', copyRoomCode);
}


// ============================================================
//  SOCKET EVENTS
// ============================================================

socket.on('connect', () => {
    mySocketId = socket.id;
    console.log('[Socket] Connesso:', mySocketId);
});

// --- Stanza creata ---
socket.on('room_created', ({ code, players, numSchede: ns }) => {
    isHost = true;
    currentRoom = { code, host: mySocketId };
    numSchede = ns;

    // Aggiorna il badge del codice stanza
    waitingRoomCode.textContent = code;
    // Aggiorna anche il titolo nella lobby-subtitle per sicurezza
    const subtitleEl = waitingRoom.querySelector('.lobby-subtitle');
    if (subtitleEl) {
        subtitleEl.innerHTML = `Codice stanza: <span id="waiting-room-code" class="room-code-badge">${code}</span>
            <button class="btn-copy-code" id="btn-copy-code" title="Copia codice">📋</button>`;
        // Ri-aggancia il listener copia
        document.getElementById('btn-copy-code')?.addEventListener('click', copyRoomCode);
    }

    btnStartOnline.style.display = 'flex';
    waitingStatus.textContent = 'Sei il conduttore della partita. Aspetta che gli altri si uniscano, poi avvia!';
    renderWaitingPlayers(players);
    showSection(waitingRoom);
});

// --- Entrato in stanza ---
socket.on('room_joined', ({ code, players, numSchede: ns, isHost: h }) => {
    isHost = h;
    currentRoom = { code };
    numSchede = ns;

    waitingRoomCode.textContent = code;
    btnStartOnline.style.display = 'none';
    waitingStatus.textContent = 'Aspetta che il conduttore avvii la partita…';
    renderWaitingPlayers(players);
    showSection(waitingRoom);
});

// --- Nuovo giocatore entrato ---
socket.on('player_joined', ({ players, newPlayer }) => {
    renderWaitingPlayers(players);
    waitingStatus.textContent = `${newPlayer} si è unito! (${players.length} giocatori)`;
});

// --- Giocatore uscito ---
socket.on('player_left', ({ players, leftPlayer }) => {
    renderWaitingPlayers(players);
    waitingStatus.textContent = `${leftPlayer} ha lasciato la stanza.`;
});

// --- Nuovo host ---
socket.on('host_changed', ({ newHostId, players }) => {
    currentRoom.host = newHostId;
    isHost = (newHostId === mySocketId);
    if (isHost) {
        btnStartOnline.style.display = 'flex';
        btnOnlineDraw.style.display = 'flex';
        waitingStatus.textContent = 'Sei diventato il conduttore!';
    }
    renderWaitingPlayers(players);
});

// --- Partita avviata ---
socket.on('game_started', ({ players, numSchede: ns }) => {
    numSchede = ns;
    drawnNumbers = [];
    myStates = [];
    myElements = [];

    onlineDrawnNumber.textContent = '--';
    onlineDrawnPhrase.textContent = '';
    onlineDrawnList.innerHTML = '';
    onlinePlayersContainer.innerHTML = '';

    // Genera le cartelle per ogni giocatore
    players.forEach((player, pIdx) => {
        const isMe = player.id === mySocketId;

        const playerCard = document.createElement('div');
        playerCard.classList.add('player-card');
        if (isMe) playerCard.classList.add('my-card');

        const title = document.createElement('h3');
        title.textContent = `${player.name}${isMe ? ' (Tu)' : ''}`;
        playerCard.appendChild(title);

        const cartelleContainer = document.createElement('div');
        cartelleContainer.classList.add('cartelle-container');

        const statesArr = [];
        const elementsArr = [];

        for (let s = 0; s < numSchede; s++) {
            const grid = generateCartella();
            const state = createCartellaState(grid);
            const cartellaEl = renderCartella(grid, pIdx, s);

            statesArr.push(state);
            elementsArr.push(cartellaEl);
            cartelleContainer.appendChild(cartellaEl);
        }

        playerCard.appendChild(cartelleContainer);
        onlinePlayersContainer.appendChild(playerCard);

        if (isMe) {
            myStates = statesArr;
            myElements = elementsArr;
        }
    });

    // Mostra/nascondi bottone estrazione
    btnOnlineDraw.style.display = isHost ? 'flex' : 'none';

    showSection(onlineGameSection);
    onlineGameSection.style.display = 'flex';
});

// --- Numero estratto ---
socket.on('number_drawn', ({ number, phrase, drawnNumbers: drawn }) => {
    drawnNumbers = drawn;

    // Aggiorna display
    onlineDrawnNumber.textContent = number;
    onlineDrawnPhrase.textContent = phrase;

    // Pallino nella lista
    const li = document.createElement('li');
    li.textContent = number;
    li.classList.add('drawn-pill');
    onlineDrawnList.appendChild(li);

    // Segna sulle mie cartelle e controlla vincite
    myStates.forEach((state, sIdx) => {
        const wins = markNumber(state, number);
        markCellInDOM(myElements[sIdx], number);

        wins.forEach(win => {
            addWinBadge(myElements[sIdx], win.type);
            // Notifica il server della vincita
            socket.emit('declare_win', {
                roomCode: currentRoom.code,
                winType: win.type,
                playerName,
            });
        });
    });
});

// --- Tutti i numeri estratti ---
socket.on('all_numbers_drawn', () => {
    btnOnlineDraw.disabled = true;
    showWinModal({ winType: 'fine', playerName: '' });
});

// --- Vincita annunciata ---
socket.on('win_announced', ({ winType, playerName: winner }) => {
    showWinModal({ winType, playerName: winner });
});

// --- Errore ---
socket.on('error_msg', (msg) => {
    showError(msg);
    showSection(onlineLobby);
});

// ============================================================
//  WIN MODAL
// ============================================================
function showWinModal({ winType, playerName: winner }) {
    const labels = {
        ambo: '🎉 AMBO!',
        terno: '🎊 TERNO!',
        quaterna: '✨ QUATERNA!',
        cinquina: '🔥 CINQUINA!',
        tombola: '🏆 TOMBOLA!',
        fine: '🎱 Fine dei numeri!',
    };

    winModalMsg.innerHTML = `
        <div class="win-type-label">${labels[winType] || winType}</div>
        ${winner ? `<div class="win-player-label">${winner}</div>` : ''}
    `;
    winModal.classList.add('visible');

    if (winType !== 'tombola' && winType !== 'fine') {
        setTimeout(() => winModal.classList.remove('visible'), 3500);
    }
}
