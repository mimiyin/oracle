// Open and connect supplicant socket
let socket;

// Testing mode
// let str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
// function generate() {
//   let rand = '';
//   while(rand.length < 10) rand += str.charAt(floor(random(str.length)));
//   return rand;
// }
// setInterval(()=>socket.emit('query', generate()), 1000);

// DOM elements
let start, prompt, options;
// How much to delay on top of ASK_TH
let delay = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  start = select("#start");
  prompt = select("#prompt");
  options = selectAll(".option");

  // Connect socket
  socket = io('/supplicant');

  // Listen for confirmation of connection
  socket.on('connect', function() {
    console.log("Connected");
  });

  // Toggle disabled options
  function disableOptions() {
    let ts = DISABLED_TS + delay;
    console.log("DISABLE TS: ", ts);
    for (let option of options) {
      option.attribute('disabled', "true");
      setTimeout(() => option.attribute('disabled', "false"), ts);
    }
  }

  // Select options
  for (let option of options) {
    option.mouseClicked(function() {
      let query = this.html();
      console.log("EMITTING QUERY", query);
      socket.emit('query', query);
      delay += DELAY_INCREMENT;
      disableOptions();
    });
  }

  // Set disabled to true right away
  disableOptions();

  // Wait to cue scene
  socket.on('cue', (scene) => cue(scene));

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
}

// Cue scene
function cue(scene) {
  // Reset delay
  delay = 0;
  let queries = selectAll('.query');
  let scenes = selectAll('.scene');
  for (let q of queries) q.remove();
  for (let s of scenes) s.attribute('hidden', s.attribute('id') != scene);
}

//Emit question
function emitQ() {
  let el = select('textarea');
  let query = el.elt.value;
  console.log("FREE QUERY: " + query);
  socket.emit('query', query);
  let write = select('#write');
  write.attribute('disabled', true);
}
