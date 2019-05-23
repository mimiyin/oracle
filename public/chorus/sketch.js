// Open and connect output socket
let socket = io('/chorus');

// Listen for confirmation of connection
socket.on('connect', function() {
  console.log("Connected");
});

// Speech stuff
let synth = window.speechSynthesis;
let voices = synth.getVoices();;
// Get voices asynchronously for Chrome
window.speechSynthesis.onvoiceschanged = e => {
  voices = synth.getVoices();
  console.log(voices);
}

function setup() {
  // Listen for blop data from server
  socket.on('query', (message) => {
    let rate = message.rate;
    let query = message.query;
    // Code to utter the string with the right computer voice
    console.log("SAY IT: " + query);
    let queryDiv = createDiv(query).attribute('id', 'query');
    // Remove query after a certain about of time
    setTimeout(() => {
      queryDiv.remove();
    }, ASK_TH);

    let sayThis = new SpeechSynthesisUtterance(query);
    sayThis.voice = voices[40]; // or 10
    sayThis.rate = rate;
    sayThis.pitch = 1;

    // Pick a random delay for this voice
    randomSeed(0);
    let rdelay = random(100);
    //synth.speak(sayThis);
    setTimeout(() => {
      console.log("SPEAKING NOW: ", query);
      synth.speak(sayThis);
    }, rdelay);
  });
}
