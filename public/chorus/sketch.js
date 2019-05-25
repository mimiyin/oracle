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
// Get voices asynchronously
window.speechSynthesis.onvoiceschanged = e => voices = synth.getVoices();

function setup() {
  noCanvas();
  // Listen for blop data from server
  socket.on('query', (message) => {
    let rate = message.rate;
    let query = message.query;
    // Code to utter the string with the right computer voice
    console.log("SAY IT: " + query);
    let queryDiv = createDiv(query).attribute('id', 'query');
    let fs = 0;
    function scaleFS(el) {
      console.log(el.size().width, );
      // Make it as tall as the window
      while(el.size().height < windowHeight - 150) {
        fs++;
        el.style('font-size', fs + 'px');
      }
      // Then make sure it fits width-wise
      while(el.size().width > windowWidth) {
        fs--;
        el.style('font-size', fs + 'px');
      }
      el.addClass('fullscreen');
    }
    // Scale font-size
    scaleFS(queryDiv);
    // Remove query after a certain about of time
    setTimeout(() => {
      queryDiv.remove();
    }, QUERY_TS);

    let sayThis = new SpeechSynthesisUtterance(query);
    sayThis.voice = voices[VOICE_SAFARI]; // or 10
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
