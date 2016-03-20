namespace Mainscreen {
  const presentBtn = document.getElementById("presentBtn");
  // It is also possible to use relative presentation URL e.g. "presentation.html"

  const presUrl = window.location.origin + '/?client';
  const handleAvailabilityChange = (available: boolean) => {
    console.log(available);
    presentBtn.style.display = available ? "inline" : "none";
  };
  // Promise is resolved as soon as the presentation display availability is
  // known.
  const request = new PresentationRequest(presUrl);
  request.getAvailability().then((availability) => {
    handleAvailabilityChange(availability.value);
    availability.onchange = function(e) {
      const availability = <PresentationAvailability>e.target;
      handleAvailabilityChange(availability.value);
    };
  }).catch(() => {
    console.warn('unable to tell if we can monitor presentation availability');
    // Availability monitoring is not supported by the platform, so discovery of
    // presentation displays will happen only after request.start() is called.
    // Pretend the devices are available for simplicity; or, one could implement
    // a third state for the button.
    handleAvailabilityChange(true);
  });

  presentBtn.onclick = function () {
      // Start new presentation.
      request.start()
        // The connection to the presentation will be passed to setConnection on
        // success.
        .then(setConnection);
        // Otherwise, the user canceled the selection dialog or no screens were
        // found.
  };

  let connection: PresentationConnection;
  function setConnection(theConnection: PresentationConnection) {
    // Disconnect from existing presentation, if any
    close();
    // Set the new connection and save the presentation ID
    connection = theConnection;
    localStorage["presId"] = connection.id;

    // monitor connection's state
    connection.onconnect = function () {
      // Allow the user to disconnect from or terminate the presentation
      // disconnectBtn.style.display = "inline";
      // stopBtn.style.display = "inline";
      // reconnectBtn.style.display = "none";

      // register message handler
      this.onmessage = function (message) {
        console.log("receive message", message.data);
      };
      // send initial message to presentation page
      this.send("say hello");
    };
    connection.onclose = reset;
    connection.onterminate = function () {
      // remove presId from localStorage if exists
      delete localStorage["presId"];
      // Reset the UI
      reset();
    };
  };

  const reset = function () {
    connection = null;
    // disconnectBtn.style.display = "none";
    // stopBtn.style.display = "none";
    // reconnectBtn.style.display = localStorage["presId"] ? "inline" : "none";
  };

  const close = function () { connection && connection.close(); };
  // disconnectBtn.onclick = close;
}
