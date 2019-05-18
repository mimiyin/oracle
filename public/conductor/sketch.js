// Open and connect output socket
let socket = io('/conductor');

// Listen for confirmation of connection
socket.on('connect', () => console.log("Connected"));

// Speak
socket.on('query', query => speak(query));

// Listen for blop data from server
socket.on('shake', message => {
  if (asked()) return;
  let id = message.id;
  let user = users[id] || createNewUser(id);
  let response = user[floor(random(user.length))];
  response.play();
});

// Remove disconnected users
socket.on('disconnected', id => delete users[id]);

// Keep track of users
let users = {};

// Oracles
let yes = [];
let no = [];
let oracles = [yes, no];
let o = 0;

// Supplicants
let supplicants = {};

// Alt-text
let rounds = [];
let current = {
  round: 0,
  part: 0
};

// Speech stuff
let synth = window.speechSynthesis;

let voices;
// Get voices asynchronously
window.speechSynthesis.onvoiceschanged = e => {
  voices=synth.getVoices();
  console.log(voices);
}


// Can respond
let last_asked;
// 3 seconds
let ASK_TH = 1000 *3;

// Ding
let ding;
// Timer
let timer_el;
let timer=0;

function preload() {
  // Load ding
  ding = loadSound("ding.wav", () => ding.setVolume(0.5));

  // Load oracle responses
  yes.push(new Response("yes.wav", "Yes"));
  yes.push(new Response("probably.wav", "Probably"));
  yes.push(new Response("maybe.wav", "Maybe"));
  no.push(new Response("never.wav", "Never"));
  no.push(new Response("no.wav", "No"));
  no.push(new Response("maybe.wav", "Maybe"));

  // Part names
  let p_names = ["Describe what you see", "Make a request", "Tell me what to do", "Tell me a story"];

  // Load alt-text
  let table = loadTable("oracle.csv", function() {
    for (let q = 1; q < table.getRowCount(); q++) {
      for (let p = 0; p < table.getColumnCount(); p++) {
        let query = table.getString(q, p);
        // Create new round
        if (query == "NEW ROUND") {
          if (p == 0) rounds.push(new Round(p_names[rounds.length]));
        } else if (query.length > 0) rounds[rounds.length - 1].addQuery(p, query);
      }
    }
    // Create table of buttons
    let tableEl = createElement('table');
    for (let r in rounds) {
      let round = rounds[r];
      let row = createElement('tr');
      let parts = round.getParts();
      for (let p in parts) {
        let part = parts[p];
        let column = createElement('td');
        let button = createButton(part.name).addClass('part');
        button.attribute('round', r);
        button.attribute('part', p);
        button.mouseClicked(manualRoll)
        row.child(column.child(button));
        let queries = part.getQueries();
        for (let q in queries) {
          let query = queries[q];
          let q_row = createElement('tr');
          let button = createButton(query);
          button.attribute('query', query);
          button.mouseClicked(sendQuery);
          q_row.child(button);
          column.child(q_row);
        }
      }
    }
  });
  // Get timer div
  timer_el = select("#timer");
  setInterval(()=>{timer--; timer_el.html(timer);}, 1000);
}

// Keep track of oracles
function createNewUser(id) {
  users[id] = oracles[o % oracles.length];
  return users[id];
}

function setup() {
  noCanvas();
  background(255);
}


// Automatically move through sections??
function autoRoll() {
  // Stop auto mode
  if(!auto) return;
  console.log(current);
  // Increment through structure
  current.part++;
  if (current.part > 3) {
    current.part = 0;
    current.round++;
    if (current.round > 3) return;
  }
  // Emit roll message
  emitRoll(current.round, current.part);

  // Set next timer
  let num_queries = rounds[current.round].parts[current.part].queries.length;
  let timespan = map(num_queries, 1, 10, 1, 5);
  setTimeout(() => autoRoll(), 1000 * 60 * timespan);
}

// Manually set section
function manualRoll() {
  emitRoll(this.attribute('round'), this.attribute('part'));
}

// Send out next part to server
function emitRoll(r, p) {
  console.log("ROLL", r, p);
  // Play ding
  ding.play();
  // Reset timer
  timer = 120;
  let data = rounds[r].getPart(p);
  if (data) {
    socket.emit('roll', rounds[r].getPart(p));
  }
}

// Manually send an individual query to all supplicants
function sendQuery() {
  let query = this.attribute('query');
  socket.emit('manual query', query);
  speak(query);
}

// Conductor speak
function speak(query) {
  // Code to utter the string with the right computer voice
  // Let oracle respond
  last_asked = millis();
  console.log("SAY IT: " + query);
  let sayThis = new SpeechSynthesisUtterance(query);
  sayThis.voice = voices[40]; // or 10
  sayThis.rate = 0.8;
  sayThis.pitch = 1;
  //synth.speak(sayThis);
}

// Has something been asked recently?
function asked() {
  return millis() - last_asked < ASK_TH;
}

// Toggle start
function cue(scene) {
  socket.emit('cue', scene);
}

// Toggle auto-pilot
function toggleAuto() {
  let state = toggleState('auto');
  if(state) autoRoll();
}
