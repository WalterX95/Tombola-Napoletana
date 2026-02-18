// ============================================================
//  server.js – Tombola Napoletana – Server Multiplayer
//  Express + Socket.IO
// ============================================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

// Serve i file statici dalla root del progetto
app.use(express.static(path.join(__dirname)));

// ============================================================
//  STATO STANZE
//  rooms[roomCode] = {
//    code, host, players[], drawnNumbers[], remainingNumbers[],
//    started, numSchede, gameOver
//  }
// ============================================================
const rooms = {};

// ============================================================
//  UTILITY
// ============================================================

/** Genera un codice stanza di 6 caratteri alfanumerici */
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
        code = Array.from({ length: 6 }, () =>
            chars[Math.floor(Math.random() * chars.length)]
        ).join('');
    } while (rooms[code]);
    return code;
}

/** Genera la lista 1-90 mescolata */
function freshNumbers() {
    const arr = Array.from({ length: 90 }, (_, i) => i + 1);
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/** Carica la smorfia dal file JSON */
let smorfia = {};
try {
    const raw = fs.readFileSync(path.join(__dirname, 'js', 'smorfia', 'smorfia.json'), 'utf8');
    smorfia = JSON.parse(raw);
} catch (e) {
    console.error('Errore caricamento smorfia:', e.message);
}

// ============================================================
//  SOCKET.IO EVENTS
// ============================================================
io.on('connection', (socket) => {
    console.log(`[+] Connesso: ${socket.id}`);

    // ----------------------------------------------------------
    //  CREA STANZA
    // ----------------------------------------------------------
    socket.on('create_room', ({ playerName, numSchede }) => {
        const code = generateRoomCode();
        rooms[code] = {
            code,
            host: socket.id,
            players: [{
                id: socket.id,
                name: playerName || 'Giocatore 1',
                ready: false,
            }],
            drawnNumbers: [],
            remainingNumbers: freshNumbers(),
            numSchede: numSchede || 3,
            started: false,
            gameOver: false,
        };

        socket.join(code);
        socket.data.roomCode = code;
        socket.data.playerName = playerName;

        socket.emit('room_created', {
            code,
            players: rooms[code].players,
            numSchede: rooms[code].numSchede,
        });

        console.log(`[ROOM] Creata stanza ${code} da ${playerName}`);
    });

    // ----------------------------------------------------------
    //  UNISCITI A STANZA
    // ----------------------------------------------------------
    socket.on('join_room', ({ roomCode, playerName }) => {
        const code = roomCode.toUpperCase().trim();
        const room = rooms[code];

        if (!room) {
            socket.emit('error_msg', 'Stanza non trovata. Controlla il codice.');
            return;
        }
        if (room.started) {
            socket.emit('error_msg', 'La partita è già iniziata.');
            return;
        }
        if (room.players.length >= 8) {
            socket.emit('error_msg', 'Stanza piena (max 8 giocatori).');
            return;
        }

        const playerNum = room.players.length + 1;
        room.players.push({
            id: socket.id,
            name: playerName || `Giocatore ${playerNum}`,
            ready: false,
        });

        socket.join(code);
        socket.data.roomCode = code;
        socket.data.playerName = playerName;

        // Notifica tutti nella stanza
        io.to(code).emit('player_joined', {
            players: room.players,
            newPlayer: playerName || `Giocatore ${playerNum}`,
        });

        // Manda al nuovo giocatore lo stato attuale
        socket.emit('room_joined', {
            code,
            players: room.players,
            numSchede: room.numSchede,
            isHost: false,
        });

        console.log(`[ROOM] ${playerName} si è unito a ${code}`);
    });

    // ----------------------------------------------------------
    //  HOST AVVIA LA PARTITA
    // ----------------------------------------------------------
    socket.on('start_game', ({ roomCode }) => {
        const room = rooms[roomCode];
        if (!room || room.host !== socket.id) return;

        room.started = true;
        room.drawnNumbers = [];
        room.remainingNumbers = freshNumbers();
        room.gameOver = false;

        io.to(roomCode).emit('game_started', {
            players: room.players,
            numSchede: room.numSchede,
        });

        console.log(`[GAME] Partita avviata in stanza ${roomCode}`);
    });

    // ----------------------------------------------------------
    //  ESTRAI NUMERO (solo host)
    // ----------------------------------------------------------
    socket.on('draw_number', ({ roomCode }) => {
        const room = rooms[roomCode];
        if (!room || room.host !== socket.id) return;
        if (!room.started || room.gameOver) return;
        if (room.remainingNumbers.length === 0) {
            io.to(roomCode).emit('all_numbers_drawn');
            return;
        }

        const number = room.remainingNumbers.pop();
        room.drawnNumbers.push(number);
        const phrase = smorfia[number] || '';

        io.to(roomCode).emit('number_drawn', {
            number,
            phrase,
            drawnNumbers: room.drawnNumbers,
            remaining: room.remainingNumbers.length,
        });

        console.log(`[DRAW] Stanza ${roomCode}: estratto ${number}`);
    });

    // ----------------------------------------------------------
    //  DICHIARA VINCITA (il client verifica localmente e notifica)
    // ----------------------------------------------------------
    socket.on('declare_win', ({ roomCode, winType, playerName }) => {
        const room = rooms[roomCode];
        if (!room) return;

        if (winType === 'tombola') {
            room.gameOver = true;
        }

        io.to(roomCode).emit('win_announced', {
            winType,
            playerName,
            socketId: socket.id,
        });

        console.log(`[WIN] ${playerName} ha dichiarato ${winType} in stanza ${roomCode}`);
    });

    // ----------------------------------------------------------
    //  DISCONNESSIONE
    // ----------------------------------------------------------
    socket.on('disconnect', () => {
        const code = socket.data.roomCode;
        const room = rooms[code];
        if (!room) return;

        room.players = room.players.filter(p => p.id !== socket.id);

        if (room.players.length === 0) {
            delete rooms[code];
            console.log(`[ROOM] Stanza ${code} eliminata (vuota)`);
        } else {
            // Se l'host se ne va, passa il ruolo al primo rimasto
            if (room.host === socket.id) {
                room.host = room.players[0].id;
                io.to(code).emit('host_changed', {
                    newHostId: room.host,
                    players: room.players,
                });
            } else {
                io.to(code).emit('player_left', {
                    players: room.players,
                    leftPlayer: socket.data.playerName,
                });
            }
        }

        console.log(`[-] Disconnesso: ${socket.id}`);
    });
});

// ============================================================
//  AVVIO SERVER
// ============================================================
if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`\n🎱 Tombola Server in ascolto su http://localhost:${PORT}\n`);
    });
}

// Esporta l'app per Vercel
module.exports = app;
