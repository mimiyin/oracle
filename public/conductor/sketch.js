// Open and connect output socket
let socket = io('/conductor');
let ssocket = io('https://' + document.location.hostname + ':8001/conductor');

// Listen for confirmation of connection
socket.on('connect', () => console.log("Connected"));

// Speak
socket.on('babble', query => speak(query, BABBLE_CHROME, BABBLE_RATE, BABBLE_PITCH, BABBLE_VOLUME, false));
socket.on('query', query => broadcast(query));

// Listen for blop data from server
ssocket.on('shake', message => {
  console.log("ORACLE SHOOK");
  //if (current.r == NUM_ROUNDS - 1 || !asked()) return;
  let id = message.id;
  let user = users[id] || createNewUser(id);
  let response = user[floor(random(user.length))];
  response.speak();
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
  r: 0,
  p: 0,
  round: null,
  part: null
};

// Speech stuff
let synth = window.speechSynthesis;

let voices = synth.getVoices();
// Get voices asynchronously
window.speechSynthesis.onvoiceschanged = e => voices = synth.getVoices();



// Can respond
let last_asked;

// Ding and click
let ding, click;
// Timer
let timer_el;
let timer = 0;

// Go completely local
let local = false;

function preload() {
  // Load ding
  ding = loadSound("ding.wav", () => ding.setVolume(DING_VOL));
  click = loadSound("click.mp3", () => ding.setVolume(CLICK_VOL));

  // Load alt-text
  let table = loadTable("oracle.csv", function() {
    console.log(table.getRowCount(), table.getColumnCount());
    // Get speaking rates for each part
    let rates = table.getRow(0).arr.map(col => parseFloat(col));
    for (let q = 1; q < table.getRowCount(); q++) {
      let query = table.getString(q, 0);
      // Skip this row if it's a new round marker
      if (query == "NEW ROUND") {
        let round = new Round(table.getString(q, NUM_PARTS))
        let r = rounds.length;
        rounds.push(round);
        // Set rates for each part in this round
        for (let p = 0; p < NUM_PARTS; p++) {
          let part = round.getPart(p);
          part.setRate(r < NUM_ROUNDS ? rates[p] : DEFAULT_RATE);
        }
        continue;
      }
      for (let p = 0; p < NUM_PARTS; p++) {
        let query = table.getString(q, p);
        if (query.length > 0) rounds[rounds.length - 1].addQuery(p, query);
      }
    }
    // Create table of buttons
    let tableEl = createElement('table');
    for (let r in rounds) {
      let round = rounds[r];
      let row = createElement('tr');
      tableEl.child(row);
      let parts = round.getParts();
      for (let p in parts) {
        let part = parts[p];
        let column = createElement('td');
        let button = createButton(round.name).addClass('part');
        button.attribute('round', r);
        button.attribute('part', p);
        button.mouseClicked(function() {
          // Reset timer
          resetTimer()
          // Toggle selected state
          if (this.attribute('selected') == "true") this.attribute('selected', "false");
          else this.attribute('selected', "true");
          // Don't emit options for introductions
          // Don't emit options for last round
          if (p > 0) {
            // Play ding
            ding.play();
            if(r < NUM_ROUNDS - 1) emitRoll(this.attribute('round'), this.attribute('part'));
          }
        });
        row.child(column.child(button));
        let queries = part.getQueries();
        for (let q in queries) {
          let query = queries[q];
          let q_row = createElement('tr');
          let button = createButton(query);
          button.attribute('query', query);
          button.attribute('rate', part.rate);
          button.mouseClicked(manualBroadcast);
          q_row.child(button);
          column.child(q_row);
        }
      }
    }
  });
  // Get timer div
  timer_el = select("#timer");
  setInterval(() => {
    timer--;
    timer_el.html(timer);
  }, 1000);
}

// Keep track of oracles
function createNewUser(id) {
  users[id] = oracles[o % oracles.length];
  return users[id];
}

function setup() {
  noCanvas();
  background(255);

  // Load oracle responses
  yes.push(new Response("Yes"));
  yes.push(new Response("Probably"));
  yes.push(new Response("Maybe"));
  no.push(new Response("No"));
  no.push(new Response("Maybe"));
  no.push(new Response("Possibly"));
}

// Send out next part to server
function emitRoll(r, p) {
  console.log("ROLL", r, p);
  // Update current section
  current.r = r;
  current.p = p;
  current.round = rounds[r];
  current.part = rounds[r].getPart(p);
  let data = {
    name: rounds[r].name,
    queries: rounds[r].getPart(p).getQueries()
  }
  socket.emit('roll', data);
  // Send rate to chorus
  socket.emit('rate', current.part.rate);
}

// Manually send an individual query to all supplicants
function manualBroadcast() {
  let query = this.attribute('query');
  let rate = this.attribute('rate');
  socket.emit('cue chorus', query);
  socket.emit('rate', rate);
  // Only speak if server is screwed
  if (local) speak(query, VOICE_CHROME, rate, pitch, 1, true);
}

// Prepare to speak selected query
function broadcast(query) {
  // Code to utter the string with the right computer voice
  // Let oracle respond
  last_asked = millis();
  console.log("SAY IT: " + query);
  let rate = current.part ? current.part.rate : 0.8;
  let pitch = 1;
  // Speak queries from supplicants
  //speak(query, VOICE_CHROME, rate, pitch, 1, true);
}

// Actually utter the text
function speak(text, voice, rate, pitch, volume, delay) {
  let sayThis = new SpeechSynthesisUtterance(text);
  sayThis.voice = voices[voice]; // or 10
  sayThis.rate = rate;
  sayThis.pitch = pitch;
  sayThis.volume = volume;
  if (delay) setTimeout(() => synth.speak(sayThis), random(SPEECH_DELAY));
  else synth.speak(sayThis);
}

// Has something been asked recently?
function asked() {
  return millis() - last_asked < ASK_TS;
}

// Cue scene
function cue(scene) {
  socket.emit('cue', scene);
}
// Cue pausing
function pause(scene) {
  click.play();
  cue(scene);
}

// Reset timer
function resetTimer() {
  timer = PART_LEN;
}

// Respond
function keyPressed() {
  switch (keyCode) {
    case TAB:
      let rindex = floor(random(yes.length));

      function speakRandomly(opts) {
        let response = opts[rindex];
        console.log("RESPONDING: ", response.text);
        response.speak();
      }
      speakRandomly(random(1) > 0.5 ? yes : no);
      break;
    case ENTER || RETURN:
      local = !local;
      break;
  }
}
