// modal.js – Gestione apertura/chiusura modali
export let modalState = false;

function changeModalState(state) {
    modalState = state;
}

/** Apre il modal con l'id specificato */
export function OpenModal(idModal) {
    const modal = document.getElementById(idModal);
    if (!modal) { console.error("Modal non trovato: " + idModal); return; }
    modal.style.display = "flex";
    changeModalState(true);
}

/** Chiude il modal con l'id specificato */
export function CloseModal(idModal) {
    const modal = document.getElementById(idModal);
    if (!modal) { console.error("Modal non trovato: " + idModal); return; }
    modal.style.display = "none";
    changeModalState(false);
}
