// Include universal settings
const SETTINGS = require('./settings.js');

// Create server
const PORT = process.env.PORT || 8000;

// Secure server
const http = require('http');

// Express web app
const express = require('express');
const app = express();

// Fileserver
const path = require('path');
const fs = require('fs');

// SSL Certs
const certOptions = {
  key: fs.readFileSync(path.resolve('cert2/server.key')),
  cert: fs.readFileSync(path.resolve('cert2/server.crt'))
}

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
// Has a free-form question been asked?
let asked = false;

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
  function emitQuery(){
    // Remove oldest query
    let query = queries.shift();
    conductors.emit('query', query);
    supplicants.emit('query', query);
    console.log("NUM Qs LEFT: ", queries.length);
  }
  // Emit
  emitQuery();
  //Emit a query every 3 seconds
  q_interval = setInterval(() => {
    if (queries.length < 1) {
      clearInterval(q_interval);
      q_interval = null;
      return;
    }
    emitQuery();
  }, SETTINGS.TIMEOUT);
}

// Clients in the conductor namespace
const conductors = io.of('/conductor');
// Listen for output clients to connect
conductors.on('connection', function(socket) {
  console.log('A conductor client connected: ' + socket.id);

  // Toggle start screen
  socket.on('cue', (scene)=>{
    console.log("SCENE: " + scene);
    cscene = scene;
    supplicants.emit('cue', scene)
  });

  // Conductor can speak too
  socket.on('query', query => {
    receiveQuery(query);
  });

  // Conductor sets query manually
  // No throttling
  socket.on('manual query', query => {
    console.log("RECEIVED MANUAL QUERY: ", query);
    supplicants.emit('query', query);
  })

  // Cue chorus
  socket.on('cue chorus', message => {
    chorus.emit('query', message);
  });

  // Let supplicants go
  socket.on('roll', function(part) {
    console.log("ROLL");
    cpart = part;
    let sdir = io.nsps['/supplicant'].sockets;
    for(let s in sdir) {
      let s_socket = sdir[s];
      sendMoreOptions(s_socket);
    }
  });

  // Listen for this output client to disconnect
  socket.on('disconnect', function() {
    console.log("A conductor client has disconnected " + socket.id);
  });
});


function sendMoreOptions(socket) {
  // If there are no options...
  if(!cpart) return;
  // Select 3 unique queries for each supplicant
  // Copy the queries
  let d_queries = [];
  let s_queries = [...cpart.queries];
  while (d_queries.length < NUM_QUERIES) {
    let rand = Math.floor(Math.random()*s_queries.length);
    let query = s_queries.splice(rand, 1);
    d_queries.push(query);
  }
  console.log("Sending options to /supplicants. ", d_queries);
  socket.emit('options', {name : cpart.name, queries : d_queries});
}

// Clients in the query namespace
const supplicants = io.of('/supplicant');
// Listen for output clients to connect
supplicants.on('connection', function(socket) {
  console.log('A supplicant client connected: ' + socket.id);

  // Tell supplicant current scene
  socket.emit('cue', cscene);
  // Send options if we're already in scene 1
  if(cscene == 'start') sendMoreOptions(socket);

  // Tell conductors when a socket has queried
  socket.on('query', (query) => {
    console.log("RECEIVED QUERY: ", query);
    // Add it to query queue
    queries.push(query);
    // If there's no query interval, start it
    if (!q_interval) startQInterval();
    // Get new options
    sendMoreOptions(socket);
  });

  // Free-form question from supplicant
  socket.on('question', (question)=>{
    if(asked) return;
    console.log("RECEIVED FIRST QUESTION: ", question);
    supplicants.emit('query', { asked : true, query: question });
    chorus.emit('query', question);
    conductors.emit('query', question);
    asked = true;
  });

  // Listen for this output client to disconnect
  socket.on('disconnect', function() {
    console.log("A query client has disconnected " + socket.id);
    //sdir[socket.id] = null;
    //delete sdir[socket.id];
  });
});

// Clients in the chorus namespace
const chorus = io.of('/chorus');
// Listen for input clients to connect
chorus.on('connection', function(socket) {
  console.log('An oracle client connected: ' + socket.id);

  // Listen for this input client to disconnect
  // Tell all of the output clients this client disconnected
  socket.on('disconnect', function() {
    console.log("A chorus client has disconnected " + socket.id);
  });
});
