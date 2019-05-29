// Open and connect output socket
let socket = io('/babble');

// Listen for confirmation of connection
socket.on('connect', function() {
  console.log("Connected");
});

function setup() {
  noCanvas();

  // Container for spoken queries
  let body = select('body');

  // Listen for blop data from server
  socket.on('query', (query) => {
    // Code to utter the string with the right computer voice
    console.log("SAY IT: ", query);

    // Say it
    speak(query, BABBLE_RATE, BABBLE_PITCH, BABBLE_VOLUME, false);
  });
}
