// Include universal settings
const SETTINGS = require('./settings.js');

// Create server
const PORT = process.env.PORT || 8000;

// Secure server
const http = require('http');

// Express web app
const express = require('express');
const app = express();

// Create secure server
const server = http.createServer(app).listen(PORT, function() {
  console.log('Server listening at port: ', PORT);
});

// Tell server where to look for files
app.use(express.static('public'));

// Create socket connection
const io = require('socket.io').listen(server);

// Current scene
let cscene = 'wait';
// Current rate
let crate = 0.8;

// How many queries does each supplicant receive?
const NUM_QUERIES = 4;
// Keep track of queries submitted
let queries = [];
// Current part
let cpart;

// Receive query
function receiveQuery(query) {
  // Add it to query queue
  queries.push(query);
  // If there's no query interval, start it
  if (!q_interval) startQInterval();
}

// Interval for sending queries
let q_interval;

// Set interval for sending out queries
function startQInterval() {
  // Emit
  function emitQuery() {
    // Remove the last query
    let query = queries.pop();
    chorus.emit('query', query);
    conductors.emit('query', query);
    supplicants.emit('query', query);
    console.log("NUM Qs LEFT: ", queries.length);
  }
  // Emit
  emitQuery();
  //Emit a query every 3 seconds
  q_interval = setInterval(() => {
    if (queries.length < 1) {
      console.log("NO MORE QUERIES");
      clearInterval(q_interval);
      q_interval = null;
      return;
    }
    emitQuery();
  }, SETTINGS.QUERY_TS);
}

// Clients in the conductor namespace
const conductors = io.of('/conductor');
// Listen for output clients to connect
conductors.on('connection', function(socket) {
  console.log('A conductor client connected: ' + socket.id);

  // Toggle start screen
  socket.on('cue', scene => {
    console.log("SCENE: " + scene);
    //Wipe out queue of queries if we're ending
    clearq();
    //Tell everyone current scene
    supplicants.emit('cue', scene);
    chorus.emit('cue', scene);
    // Update current scene
    cscene = scene;
  });

  // Cue chorus
  socket.on('cue chorus', query => chorus.emit('query', query));

  // Let supplicants go
  socket.on('roll', part => {
    console.log("ROLL");
    // Clear queue
    clearq();
    // New query options
    cpart = part;
    let sdir = io.nsps['/supplicant'].sockets;
    for (let s in sdir) {
      let s_socket = sdir[s];
      sendMoreOptions(s_socket);
    }
  });

  // Tell chorus rate
  socket.on('rate', rate => {
    console.log("New rate.", rate);
    crate = rate;
    chorus.emit('rate', crate);
  });

  // Listen for this output client to disconnect
  socket.on('disconnect', () => {
    console.log("A conductor client has disconnected " + socket.id);
  });
});

function sendMoreOptions(socket) {
  // If there are no options...
  if (!cpart) return;
  // Select 3 unique queries for each supplicant
  // Copy the queries
  let d_queries = [];
  let s_queries = [...cpart.queries];
  while (d_queries.length < NUM_QUERIES) {
    let rand = Math.floor(Math.random() * s_queries.length);
    let query = s_queries.splice(rand, 1);
    d_queries.push(query);
  }
  console.log("Sending options to /supplicants. ", d_queries);
  socket.emit('options', {
    name: cpart.name,
    queries: d_queries
  });
}

// Clients in the query namespace
const supplicants = io.of('/supplicant');
// Listen for output clients to connect
supplicants.on('connection', socket => {
  console.log('A supplicant client connected: ' + socket.id);

  // Tell supplicant current scene
  socket.emit('cue', cscene);

  // Send options if we're already in scene 1
  if (cscene == 'start') sendMoreOptions(socket);

  // Tell conductors when a socket has queried
  socket.on('query', query => {
    console.log("RECEIVED QUERY: ", query);
    // Send query as text right away
    if (cscene == 'start') babble.emit('query', query);

    // Add it to query queue
    queries.push(query);
    // If there's no query interval, start it
    if (!q_interval) startQInterval();
    // Get new options
    sendMoreOptions(socket);
    // Remove oldest query after we've reached 40 (12000 / 3000)
    if (queries.length > SETTINGS.QMAX) queries.shift();
  });

  // Listen for this output client to disconnect
  socket.on('disconnect', () => {
    console.log("A supplicant client has disconnected " + socket.id);
  });
});

// Clients in the chorus namespace
const chorus = io.of('/chorus');
// Listen for input clients to connect
chorus.on('connection', socket => {
  console.log('A chorus client connected: ' + socket.id);
  // Tell chorus scene
  socket.emit('cue', cscene);
  socket.emit('rate', crate);
  // Listen for this input client to disconnect
  // Tell all of the output clients this client disconnected
  socket.on('disconnect', () => {
    console.log("A chorus client has disconnected " + socket.id);
  });
});

// Clients in the babble namespace
const babble = io.of('/babble');
// Listen for input clients to connect
chorus.on('connection', socket => {
  console.log('A babble client connected: ' + socket.id);

  // Listen for this input client to disconnect
  // Tell all of the output clients this client disconnected
  socket.on('disconnect', () => {
    console.log("A chorus client has disconnected " + socket.id);
  });
});

// Clear queue
function clearq(){
  queries.length = 0;
  console.log("CLEARED Q: ", queries.length);
}
