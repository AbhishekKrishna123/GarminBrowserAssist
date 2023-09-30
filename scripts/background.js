console.log("=== background.js ===");

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log("Message from popup: " + request);

    if (request == "Export_TCX") {        
        // Send a message to the content script of the active tab
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, request, function (response) {
                // Handle the response from the content script
                console.log("Response from content script: " + response);
                // Send a response back to the popup script
                sendResponse(response);
            });
        });
        // Return true to indicate that we will send a response asynchronously
        return true;
    }
});