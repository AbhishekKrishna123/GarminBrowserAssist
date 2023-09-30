// popup.js
// Get the button elements from the popup UI
var button = document.getElementById("tcx-button");

// Add a click event listener to button 1
button.addEventListener("click", function () {
    // Log a message to the console
    console.log("Button clicked");
    
    // Send a message to the background script
    chrome.runtime.sendMessage("Export_TCX", function (response) {
        // Handle the response from the background script
        console.log(response);
    });
});
