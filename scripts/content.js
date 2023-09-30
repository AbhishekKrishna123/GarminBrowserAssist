async function downloadTcx(activityId)
{
    // Get the bearer token from the localStorage
    var tokenObject = JSON.parse(window.localStorage.token);

    const headers = new Headers({
        'Authorization': `Bearer ${tokenObject["access_token"]}`,
        'Di-Backend': 'connectapi.garmin.com'
    });

    var url = "https://connect.garmin.com/download-service/export/tcx/activity/" + activityId;
    
    return fetch(url, {
        method: 'GET',
        headers: headers
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    });
}

function downloadFile(data, type, filename)
{
    // Create an invisible A element
    const a = document.createElement("a");
    a.style.display = "none";
    document.body.appendChild(a);
    
    // Set the HREF to a Blob representation of the data to be downloaded
    a.href = window.URL.createObjectURL(
        new Blob([data], { "type": type })
    );
    
    // Use download attribute to set set desired file name
    a.setAttribute("download", filename);
    
    // Trigger the download by simulating click
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
}

function enhancePage()
{
    // If the page has already been modified, then do not modify.
    if (document.getElementsByClassName("tcx-checkbox").length > 0) {
        return;
    }

    // Get all the rows on the page
    var rows = document.getElementsByClassName("list-item");

    console.log("Found " + rows.length + " rows");

    // Loop through each row
    for (let i = 0; i < rows.length; i++) {
        
        // Get container
        var container = rows[i].querySelector(".list-item-container");

        // Title
        var rowTitle = container.querySelector(".activity-name-type");
        rowTitle.setAttribute("style", "width: calc(45% - 270px)");

        var activityIdAnchor = rowTitle.querySelector(".inline-edit-target");
        var activityId = activityIdAnchor.getAttribute("href").split("/")[3];

        // Create a div element
        var div = document.createElement("div");
        div.setAttribute("class", "pull-left type-icon activity-col");
        div.textContent = "TCX"
        div.setAttribute("style", "cursor: pointer");
        div.setAttribute("activityId", activityId);

        // Add an event listener to the button
        div.addEventListener("click", async function (event) {
            
            let rowsArr = Array.from(document.getElementsByClassName("list-item"));

            // Find the selected activities.
            var selectedIds = [];
            rowsArr.forEach(row => {
                var chkBox = row.querySelector(".tcx-checkbox");
                if (chkBox.checked) {
                    selectedIds.push(chkBox.getAttribute("activityId"));
                    chkBox.checked = false;
                }
            });

            selectedIds = selectedIds.sort();
            console.log(selectedIds);

            var finalXmlDoc = null;
            let parser = new DOMParser();
            
            for (var idx=0; idx<selectedIds.length; idx++) {
                const activityId = selectedIds[idx];
                var tcxDataStr = await downloadTcx(activityId);
                
                if (finalXmlDoc == null) {
                    finalXmlDoc = parser.parseFromString(tcxDataStr, "text/xml");
                    console.log(finalXmlDoc.getElementsByTagName("Activity")[0]);
                }
                else {
                    var currXmlDoc = parser.parseFromString(tcxDataStr, "text/xml");
                    const newLaps = Array.from(currXmlDoc.getElementsByTagName("Lap"));
                    console.log(`Found ${newLaps.length} laps in this activity.`)
                    console.log(newLaps);
                    for (let k=0; k<newLaps.length; k++) {
                        console.log(`k=${k}; newLaps.length=${newLaps.length}`);
                        console.log(newLaps[k]);

                        const currLapCount = finalXmlDoc.getElementsByTagName("Lap").length;
                        finalXmlDoc.getElementsByTagName("Lap")[currLapCount-1].after(newLaps[k]);
                        // finalXmlDoc.getElementsByTagName("Activity")[0].appendChild(newLaps[k]);
                    }
                }

                // Check if we are done.
                if (idx+1 == selectedIds.length)
                {
                    const serializer = new XMLSerializer();
                    const xmlStr = serializer.serializeToString(finalXmlDoc);
                    downloadFile(xmlStr, "text/xml", `${activityId}_merged_${selectedIds.length}.tcx`);
                }
            }
        });

        container.prepend(div);

        // Add a checkbox
        var checkboxDiv = document.createElement("div");
        checkboxDiv.setAttribute("class", "pull-left type-icon activity-col");
        checkboxDiv.setAttribute("style", "display: flex; justify-content: center;");
        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.setAttribute("class", "tcx-checkbox");
        checkbox.setAttribute("activityId", activityId);
        checkbox.setAttribute("style", "margin: 0");
        checkboxDiv.prepend(checkbox);
        container.prepend(checkboxDiv);
    }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {    
    console.log("Message received: " + request);
    if (request == "Export_TCX")
    {
        sendResponse("TCX Export enhancement done!");
        enhancePage();
    }
});