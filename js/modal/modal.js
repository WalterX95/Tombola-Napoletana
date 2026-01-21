//Set Modal State Data 
export let modalState = false;
import { msg } from "../index.js";

let modalClass = document.querySelectorAll(".modal");
let closeModalBtn = document.querySelectorAll(".close-modal");

function changeModalState(state) {
    modalState = state;
}

//Export  Open Modal Function

export function OpenModal(IdModal) {
    let modal = document.getElementById(IdModal);
    modalClass.forEach(function(modalElement) {
    if(modal.contains(modalElement)) {
         modalElement.style.display = "flex";
         msg("Modal Opened: " + IdModal, "info");
         changeModalState(true);
    }
    else {
        msg("Modal Element Not Found: " + IdModal, "error");
    }
});
    
   
}

//Export Close Modal Function
export function CloseModal(IdModal) {
    let modal = document.getElementById(IdModal);
    closeModalBtn.forEach(function(btn) {
        btn.addEventListener("click", function() { 
            if(modal.contains(btn)) {
               modal.style.display = "none";
               msg("Modal Closed: " + IdModal, "info");
               changeModalState(false);
            }   
         });  
    });
}


