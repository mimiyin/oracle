// Open and connect output socket
let socket = io('/conductor');

// Listen for confirmation of connection
socket.on('connect', function() {
  console.log("Connected");
});

// Keep track of users
let users = {};

// Oracles
let yes = [];
let no = [];
let oracles = [yes, no];
let o = 0;

// Supplicants
let supplicants = {};

// What next
let asked = false;

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
window.speechSynthesis.onvoiceschanged = function(e) {
  voices = synth.getVoices();
};

function preload() {
  // Load oracle responses
  yes.push(new Response("yes.wav", "Yes"));
  yes.push(new Response("probably.wav", "Probably"));
  yes.push(new Response("maybe.wav", "Maybe"));
  no.push(new Response("never.wav", "Never"));
  no.push(new Response("no.wav", "No"));
  no.push(new Response("maybe.wav", "Maybe"));

  // Round and part names
  let p_names = ["Describe what you see", "Tell us what to do", "Make a request", "Confirm what you suspect"];
  let r_names = ["ACTION", "DESIRE", "SUBMISSION", "INEVITABILITY"];

  // Load alt-text
  let table = loadTable("oracle.csv", function() {
    for (let q = 1; q < table.getRowCount(); q++) {
      for (let p = 0; p < table.getColumnCount(); p++) {
        let query = table.getString(q, p);
        // Create new round
        console.log(match(query, "NEW ROUND:"));
        if (query == "NEW ROUND") {
          if (p == 0) rounds.push(new Round(r_names[rounds.length], p_names));
        } else if (query.length > 0) rounds[rounds.length - 1].addQuery(p, query);
      }
    }
    // Create table of buttons
    let tableEl = createElement('table');
    for (let r in rounds) {
      let round = rounds[r];
      let row = createElement('tr');
      let row_header = createElement('tr', round.name);
      tableEl.child(row.child(row_header));
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
}

function createNewUser(id) {
  users[id] = oracles[o % oracles.length];
  return users[id];
}

function setup() {
  //createCanvas(windowWidth, windowHeight);
  noCanvas();
  background(255);

  // Listen for blop data from server
  socket.on('shake', function(message) {
    if (asked) return;
    let id = message.id;
    let user = users[id] || createNewUser(id);
    //let trying = true;
    //while (trying) {
    let response = user[floor(random(user.length))];
    response.play();
    // Wait 1 second
    setTimeout(function() {
      roll();
    }, 1000);

    //trying = false;
    //}
  });
  // Speak
  socket.on('query', function(query) {
    speak(query);
  });
  // Remove disconnected users
  socket.on('disconnected', function(id) {
    delete users[id];
  });
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
  let data = rounds[r].getPart(p);
  if (data) {
    socket.emit('roll', rounds[r].getPart(p));
    asked = false;
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
  console.log("SAY IT: " + query);
  let sayThis = new SpeechSynthesisUtterance(query);
  sayThis.voice = voices[10];
  console.log(voices);
  synth.speak(sayThis);
  asked = true;
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
