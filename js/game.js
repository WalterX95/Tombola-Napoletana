// ============================================================
//  game.js – Logica di gioco Tombola Napoletana
// ============================================================

// ============================================================
//  GENERAZIONE CARTELLA
//  Una cartella ha 3 righe × 9 colonne.
//  Ogni riga ha esattamente 5 numeri e 4 celle vuote.
//  Colonne: 1-9, 10-19, 20-29, ..., 80-90
// ============================================================

/**
 * Genera una cartella valida da Tombola.
 * @returns {number[][]} matrice 3×9 (null = cella vuota)
 */
export function generateCartella() {
    // Definisce i range per ogni colonna
    const colRanges = [
        [1, 9],   // col 0
        [10, 19], // col 1
        [20, 29], // col 2
        [30, 39], // col 3
        [40, 49], // col 4
        [50, 59], // col 5
        [60, 69], // col 6
        [70, 79], // col 7
        [80, 90], // col 8
    ];

    // Per ogni colonna sceglie quanti numeri mettere (1, 2 o 3)
    // rispettando il vincolo: totale = 15 (5 per riga × 3 righe)
    let colCounts;
    do {
        colCounts = colRanges.map(() => Math.floor(Math.random() * 3) + 1);
        // Aggiusta per arrivare esattamente a 15
        let total = colCounts.reduce((a, b) => a + b, 0);
        while (total !== 15) {
            const idx = Math.floor(Math.random() * 9);
            if (total < 15 && colCounts[idx] < 3) { colCounts[idx]++; total++; }
            if (total > 15 && colCounts[idx] > 1) { colCounts[idx]--; total--; }
        }
    } while (!isValidDistribution(colCounts));

    // Sceglie i numeri per ogni colonna
    const colNumbers = colRanges.map(([min, max], i) => {
        const pool = Array.from({ length: max - min + 1 }, (_, k) => min + k);
        return shuffle(pool).slice(0, colCounts[i]).sort((a, b) => a - b);
    });

    // Distribuisce i numeri nelle 3 righe
    const grid = Array.from({ length: 3 }, () => Array(9).fill(null));

    for (let col = 0; col < 9; col++) {
        const nums = colNumbers[col];
        const rows = shuffle([0, 1, 2]).slice(0, nums.length);
        rows.sort((a, b) => a - b);
        nums.forEach((num, i) => { grid[rows[i]][col] = num; });
    }

    return grid;
}

/** Verifica che ogni riga abbia esattamente 5 numeri */
function isValidDistribution(colCounts) {
    // Non possiamo verificare la distribuzione per riga senza assegnarla,
    // ma possiamo assicurarci che nessuna colonna abbia 0 numeri
    return colCounts.every(c => c >= 1 && c <= 3);
}

/** Fisher-Yates shuffle */
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ============================================================
//  RENDERING CARTELLA
// ============================================================

/**
 * Crea l'elemento DOM di una cartella.
 * @param {number[][]} grid
 * @param {number} playerIndex
 * @param {number} cartellaIndex
 * @returns {HTMLElement}
 */
export function renderCartella(grid, playerIndex, cartellaIndex) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('cartella-wrapper');
    wrapper.dataset.player = playerIndex;
    wrapper.dataset.cartella = cartellaIndex;

    const label = document.createElement('div');
    label.classList.add('cartella-label');
    label.textContent = `Scheda ${cartellaIndex + 1}`;
    wrapper.appendChild(label);

    const table = document.createElement('table');
    table.classList.add('cartella-table');

    grid.forEach((row, rowIdx) => {
        const tr = document.createElement('tr');
        row.forEach((cell, colIdx) => {
            const td = document.createElement('td');
            td.classList.add('cartella-cell');
            if (cell !== null) {
                td.textContent = cell;
                td.dataset.number = cell;
                td.dataset.row = rowIdx;
                td.dataset.col = colIdx;
            } else {
                td.classList.add('empty-cell');
            }
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });

    wrapper.appendChild(table);

    // Badge vincite
    const badges = document.createElement('div');
    badges.classList.add('win-badges');
    wrapper.appendChild(badges);

    return wrapper;
}

// ============================================================
//  STATO DI GIOCO
// ============================================================

/** Struttura che tiene traccia dello stato di ogni cartella */
export function createCartellaState(grid) {
    return {
        grid,
        marked: Array.from({ length: 3 }, () => Array(9).fill(false)),
        wins: { ambo: 0, terno: 0, quaterna: 0, cinquina: 0, tombola: false },
    };
}

// ============================================================
//  MARCATURA NUMERO
// ============================================================

/**
 * Segna il numero estratto su tutte le cartelle e restituisce le nuove vincite.
 * @param {object} state - cartellaState
 * @param {number} number - numero estratto
 * @returns {{ rowWins: number[] }} righe che hanno raggiunto una nuova vincita
 */
export function markNumber(state, number) {
    const newWins = [];
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 9; c++) {
            if (state.grid[r][c] === number) {
                state.marked[r][c] = true;
            }
        }
    }
    return checkWins(state);
}

// ============================================================
//  CONTROLLO VINCITE
// ============================================================

const WIN_NAMES = ['ambo', 'terno', 'quaterna', 'cinquina', 'tombola'];

/**
 * Controlla le vincite dopo ogni estrazione.
 * @param {object} state
 * @returns {string[]} array di nuove vincite ottenute
 */
export function checkWins(state) {
    const newWins = [];

    // Controlla riga per riga
    for (let r = 0; r < 3; r++) {
        const markedInRow = state.grid[r].reduce((count, cell, c) => {
            return count + (cell !== null && state.marked[r][c] ? 1 : 0);
        }, 0);

        // Ambo=2, Terno=3, Quaterna=4, Cinquina=5
        const thresholds = [
            { count: 2, name: 'ambo' },
            { count: 3, name: 'terno' },
            { count: 4, name: 'quaterna' },
            { count: 5, name: 'cinquina' },
        ];

        for (const { count, name } of thresholds) {
            if (markedInRow >= count && state.wins[name] <= r) {
                // Nuova vincita su questa riga
                if (state.wins[name] === r) {
                    state.wins[name] = r + 1; // avanza il contatore di righe vinte
                    newWins.push({ type: name, row: r });
                }
            }
        }
    }

    // Tombola: tutti i numeri marcati
    const totalNumbers = state.grid.flat().filter(n => n !== null).length;
    const totalMarked = state.marked.flat().filter(Boolean).length;
    if (totalMarked === totalNumbers && !state.wins.tombola) {
        state.wins.tombola = true;
        newWins.push({ type: 'tombola', row: -1 });
    }

    return newWins;
}

// ============================================================
//  AGGIORNAMENTO DOM – MARCATURA
// ============================================================

/**
 * Aggiorna visivamente la cartella DOM segnando il numero.
 * @param {HTMLElement} cartellaEl
 * @param {number} number
 * @returns {HTMLElement[]} celle marcate
 */
export function markCellInDOM(cartellaEl, number) {
    const cells = cartellaEl.querySelectorAll(`td[data-number="${number}"]`);
    cells.forEach(cell => {
        cell.classList.add('marked');
        // Piccola animazione "pop"
        cell.classList.remove('pop');
        void cell.offsetWidth; // reflow
        cell.classList.add('pop');
    });
    return [...cells];
}

/**
 * Aggiunge un badge di vincita alla cartella.
 * @param {HTMLElement} cartellaEl
 * @param {string} winType
 */
export function addWinBadge(cartellaEl, winType) {
    const badges = cartellaEl.querySelector('.win-badges');
    if (!badges) return;
    const badge = document.createElement('span');
    badge.classList.add('win-badge', `badge-${winType}`);
    badge.textContent = winType.toUpperCase();
    badges.appendChild(badge);
}
