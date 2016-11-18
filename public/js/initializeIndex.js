'use strict';

// Call this function when the page loads (the "ready" event)
$(document).ready(function() {
	initializePage();
})

function initializePage() {
/*
 * Function that is called when the document is ready.
 */
 $("#scientistButton").click(function(e) {
        //$('#buttonContainer').append("<h1>Science!</h1>");
        window.location.href = "/scientist";
                                        });
               
 $("#citizenButton").click(function(e) {
        window.location.href = "/citizen";
                                       });
 $("#mapButton").click(function(e) {
        window.location.href = "/map";
                                       });
 $("#loginButton").click(function(e) {
        window.location.href = "/index";
                                       });
 $("#cancelButton").click(function(e) {
        window.location.href = "/index";
                                       }); 
 $("#aboutButton").click(function(e) {
        window.location.href = "/about";
                                       });
  $("#helpButton").click(function(e) {
        window.location.href = "/help";
                                       });
}
