// Include universal settings
const SETTINGS = require('./settings.js');

// Create server
const PORT = process.env.PORT || 8000;

// Secure server
const https = require('https');

// Express web app
const express = require('express');
const app = express();

// Fileserver
const path = require('path');
const fs = require('fs');

// SSL Certs
const certOptions = {
  key: fs.readFileSync(path.resolve('cert/server.key')),
  cert: fs.readFileSync(path.resolve('cert/server.crt'))
}

// Create secure server
const server = https.createServer(certOptions, app).listen(PORT, function() {
  console.log('Server listening at port: ', PORT);
});

// Tell server where to look for files
app.use(express.static('public'));

// Create socket connection
const io = require('socket.io').listen(server);

//Current scene
let cscene = 'start';

// How many queries does each supplicant receive?
const NUM_QUERIES = 5;
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
  }, 3000);
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
  socket.on('query', function(query) {
    receiveQuery();
  });

  // Conductor sets query manually
  // No throttling
  socket.on('manual query', function(query) {
    supplicants.emit('query', query);
  })

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
  //console.log(io.nsps['/supplicant'].sockets);
  // Keep track of supplicants
  //sdir[socket.id] = socket;
  // Test query
  // socket.emit('query', 'Test1');
  // socket.emit('query', 'Test2');

  // Tell conductors when a socket has queried
  socket.on('query', function(query) {
    // Add it to query queue
    queries.push(query);
    // If there's no query interval, start it
    if (!q_interval) startQInterval();
    // Get new options
    if(cpart)sendMoreOptions(socket);
  });

  // Listen for this output client to disconnect
  socket.on('disconnect', function() {
    console.log("A query client has disconnected " + socket.id);
    //sdir[socket.id] = null;
    //delete sdir[socket.id];
  });
});

// Clients in the response namespace
const oracles = io.of('/oracle');
// Listen for input clients to connect
oracles.on('connection', function(socket) {
  console.log('An oracle client connected: ' + socket.id);

  // Listen for blop data
  socket.on('shake', function(data) {
    // Data comes in as whatever was sent, including objects
    //console.log("Received: 'message' " + data);

    let message = {
      id: socket.id,
      data: data
    }

    // Send it to all of the output clients
    conductors.emit('shake', message);
  });

  // Listen for this input client to disconnect
  // Tell all of the output clients this client disconnected
  socket.on('disconnect', function() {
    console.log("An oracle client has disconnected " + socket.id);
    outputs.emit('disconnected', socket.id);
  });
});
