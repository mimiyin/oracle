// Open and connect supplicant socket
let socket = io('/supplicant');

// Listen for confirmation of connection
socket.on('connect', function() {
  console.log("Connected");
});

// Testing mode
// let str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
// function generate() {
//   let rand = '';
//   while(rand.length < 10) rand += str.charAt(floor(random(str.length)));
//   return rand;
// }
// setInterval(()=>socket.emit('query', generate()), 1000);

// DOM elements
let prompt, options;

function setup() {
  createCanvas(windowWidth, windowHeight);
  prompt = select("#prompt");
  options = selectAll(".option");

  // Select options
  for (let option of options) {
    option.mouseClicked(function() {
      console.log("EMITTING QUERY", this.html());
      socket.emit('query', this.html());
    });
  }

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


  // Load query
  socket.on('query', message => {
    console.log("QUERY", message);
    let query = message;
    if (message.asked) query = message.query;
    let queryDiv = createDiv(query).addClass('query');
    // Remove query after a certain about of time
    if (!message.asked) {
      setTimeout(() => {
        queryDiv.remove();
      }, ASK_TH);
    }
  });
}

// Cue scene
function cue(scene) {
  let queries = selectAll('.query');
  let scenes = selectAll('.scene');
  for(let q of queries) q.remove();
  for (let s of scenes) s.attribute('hidden', s.attribute('id') != scene);
}

//Emit question
function emitQ() {
  let el = select('textarea');
  let value = el.elt.value;
  console.log("FREE QUERY: " + value);
  socket.emit('question', value);
}
