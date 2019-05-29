// Open and connect output socket
let socket = io('/conductor');

// Listen for confirmation of connection
socket.on('connect', () => console.log("Connected"));

// Speak
socket.on('query', query => receiveQuery(query));

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
  click = loadSound("click.mp3", () => click.setVolume(CLICK_VOL));

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
          part.setRate(r < NUM_ROUNDS - 1 ? rates[p] : DEFAULT_RATE);
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
          // Update current
          updateCurrent(this.attribute('round'), this.attribute('part'));
          // Don't emit options for introductions
          // Don't emit options for last round
          if (p > 0) {
            // Play ding
            ding.play();
            if(r < NUM_ROUNDS - 1) emitRoll();
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

// Update current section
function updateCurrent(r, p) {
  console.log("ROLL", r, p);
  current.r = r;
  current.p = p;
  current.round = rounds[r];
  current.part = rounds[r].getPart(p);
}

// Send out next part to server
function emitRoll() {
  console.log("EMIT OPTIONS: ", current.r, current.p);
  let data = {
    name: current.round.name,
    queries: current.part.getQueries()
  }
  socket.emit('roll', data);
  // Send rate to chorus
  socket.emit('rate', current.part.rate);
}

// Manually send an individual query to chorus
function manualBroadcast() {
  let query = this.attribute('query');
  let rate = this.attribute('rate');
  socket.emit('cue chorus', query);
  socket.emit('rate', rate);
  decideToRespond(query, true, rate)
  // Speak manual queries without delay
  if(local) speak(query, rate, rate, DEFAULT_VOLUME, false);
}

// Prepare to speak supplicant selected query
function receiveQuery(query) {
  console.log("RECEIVED QUERY FROM SUPPLICANT: " + query);
  // Decide whether to respond to it or not
  decideToRespond();
  // Speak queries from supplicants with random delay
  if (local) {
    let rate = current.part ? current.part.rate : 0.8;
    speak(query, rate, DEFAULT_PITCH, DEFAULT_VOLUME, true);
  }
}

// Cue scene
function cue(scene) {
  socket.emit('cue', scene);
}

// Trigger end of scene sound
function almost() {
  click.play();
}

// Reset timer
function resetTimer() {
  timer = PART_LEN;
}

// Decide whether or not to respond to query
function decideToRespond() {
  console.log("DECIDING WHETHER TO RESPOND", current.r);
  if(!(current.r in ROUNDS)) return;
  if(random(1) > RESPOND_TH) {
    setTimeout(()=>respond(), random(RESPOND_DELAY));
  }
}

// Select random response
function respond(){
  let rindex = floor(random(yes.length));
  function speakRandomly(opts) {
    let response = opts[rindex];
    response.speak();
  }
  speakRandomly(random(1) > 0.5 ? yes : no);
}

// Respond
// Toggle local
function keyPressed() {
  switch (keyCode) {
    case TAB:
      respond();
      break;
    case ENTER || RETURN:
      local = !local;
      break;
  }
}
