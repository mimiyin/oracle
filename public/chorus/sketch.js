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
  // Container for query texts
  let babble = select('#babble');
  // Display the query text right away
  socket.on('babble', (query) => {
    let babbleSpan = createSpan(query).addClass('babble');
    babble.child(babbleSpan);
    // Remove query after a certain about of time
    setTimeout(() => {
      babbleSpan.remove();
    }, QUERY_TEXT_TS);
  });

  // Container for spoken queries
  let body = select('body');
  // Listen for blop data from server
  socket.on('query', (message) => {
    let rate = message.rate;
    let query = message.query;
    // Code to utter the string with the right computer voice
    console.log("SAY IT: " + query);
    let queryDiv = createDiv(query).addClass('query');
    console.log(queryDiv.size());
    // Size the font to the screen
    let fs = 0;

    function scaleFS(el) {
      // Make it as tall as the window
      while (el.size().height < windowHeight - 150) {
        console.log(el.size().width, windowWidth);
        fs++;
        el.style('font-size', fs + 'px');
      }
      // Then make sure it fits width-wise
      while (el.size().width > windowWidth) {
        fs--;
        el.style('font-size', fs + 'px');
      }
      el.addClass('fullscreen');
    }
    // Scale font-size
    scaleFS(queryDiv);
    // Make it green
    body.addClass('chartreuse');
    // Remove query after a certain about of time
    setTimeout(() => {
      queryDiv.remove();
      body.removeClass('chartreuse');
    }, QUERY_TS);
    // Say it
    speak(query, rate, 1, 1, true);
  });
}

function speak(text, rate, pitch, volume, delay) {
  let sayThis = new SpeechSynthesisUtterance(text);
  sayThis.voice = voices[VOICE_SAFARI]; // or 10
  sayThis.rate = rate;
  sayThis.pitch = pitch;
  sayThis.volume = volume;

  // Delay the speech by some random amount
  if (delay) {
    setTimeout(() => {
      console.log("SPEAKING NOW: ", query);
      synth.speak(sayThis);
    }, random(SPEECH_DELAY));
  } else synth.speak(sayThis);
}
