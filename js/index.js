import { OpenModal, CloseModal } from "./modal/modal.js";

//let Menu = document.getElementById("navbar");
let btnInitGame = document.getElementById("new-game");
let btncloseModal = document.getElementById("close-new-game-modal");
let btnStartGamed = document.getElementById("confirm-new-game");
let gameSection = document.getElementById("game-section");
let numPlayersInput = document.getElementById("num-players");   
let numSchede = document.getElementById("num-schede");

///Button Logic Data 

let draftNumber = document.getElementById("draw-number-button");
let numberExtract = document.getElementById("drawn-number");
let drawnNumbersList = document.getElementById("drawn-numbers-list");

let drawnNumbers = [];

//Function to Draw Number

//Log Function Type Console
export function msg(text,type) {
    switch(type) {
        case 'error':
            console.error(text);
            break;
        case 'warning':
            console.warn(text);
            break;
        case 'info':
            console.info(text);
            break;
        default:
            console.log(text);
    }
}

btnInitGame.addEventListener("click", function() {
      msg("Game Initialized", "info");
      OpenModal("new-game-modal");
});

btncloseModal.addEventListener("click", function() {
    msg("Close Modal Button Clicked", "info");
    CloseModal("new-game-modal");
});


/* InitGameFirst*/
//Start CloseModal on Click Outside Modal
window.addEventListener("DOMContentLoaded", function() {
    CloseModal("new-game-modal");
});

btnStartGamed.addEventListener("click", function() {
    msg("Start New Game Button Clicked", "info"); 
    gameSection.style.display = "flex";
    CloseModal("new-game-modal");
});

//Log Input Changes
numPlayersInput.addEventListener("change", function() {
    //Log Number of Players Change
    msg("Number of Players Changed: " + numPlayersInput.value, "info");
});

numSchede.addEventListener("change", function() {
    //lOG Number of Schede Change
    msg("Number of Schede Changed: " + numSchede.value, "info");
}); 


let smorfia = {};

async function loadSmorfia() {
    try {
        const response = await fetch('../js/smorfia/smorfia.json');
        smorfia = await response.json();
    } catch (error) {
        console.error("Errore nel caricamento della Smorfia:", error);
    }
}

// Carica la smorfia all'avvio
loadSmorfia();

// ================================
// ESTRAZIONE NUMERO + FRASE
// ================================
function extractNumberAndSmorfia() {
    const number = Math.floor(Math.random() * 90) + 1;
    const phrase = smorfia[number];

    return { number, phrase };
}

// ================================
// CLICK BOTTONE ESTRAZIONE
// ================================
draftNumber.addEventListener("click", function () {
    msg("Draft Number Button Clicked", "info");

    const { number, phrase } = extractNumberAndSmorfia();

    numberExtract.textContent = number + " - " + phrase;
    drawnNumbers.push(number);
    drawnNumbersList.textContent = drawnNumbers.join(", ");

    console.log(`Numero estratto: ${number} – Smorfia: ${phrase}`);

    // Esempio di utilizzo frase:
    // smorfiaText.textContent = phrase;
    // showModal(`È uscito il numero ${number}… ${phrase}!`);

    draftNumber.disabled = drawnNumbers.length >= 90;
    
});

