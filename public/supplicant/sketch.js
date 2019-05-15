// Open and connect supplicant socket
let socket = io('/supplicant');

// Listen for confirmation of connection
socket.on('connect', function() {
  console.log("Connected");
});

// DOM elements
let prompt, options;

// Speech stuff
let synth = window.speechSynthesis;
let voices = synth.getVoices();

function setup() {
  createCanvas(windowWidth, windowHeight);
  prompt = select("#prompt");
  options = selectAll(".option");

  // Select options
  for (let option of options) {
    option.touchEnded(function() {
      console.log("EMITTING QUERY", this.html());
      socket.emit('query', this.html());
    });
  }

  // Wait to cue scene
  socket.on('cue', (scene) => {
    let scenes = selectAll('.scene');
    for (let s of scenes) s.attribute('hidden', s.attribute('id') != scene);
  });

  // Load prompt and options
  // You'// get new options as soon as you select something
  socket.on('options', function(opts) {
    console.log("OPTIONS", opts.queries);
    prompt.html(opts.name);
    for (let o in opts.queries) {
      let option = opts.queries[o];
      options[o].html(option);
    }
  });

  // Load query
  socket.on('query', function(q) {
    console.log("QUERY", q);
    let query = createDiv(q).attribute('id', 'query');
    let sayThis = new SpeechSynthesisUtterance(q);
    sayThis.voice = voices[1];
    synth.speak(sayThis);
    // Remove query after a certain about of time
    setTimeout(() => {
      query.remove();
    }, 3000);
  })
}

//
function emitQ() {
  let el = select('input');
  let value = el.elt.value;
  console.log(value);
  socket.emit('query', value);
}
