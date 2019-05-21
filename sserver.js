// Create server
const PORT = process.env.PORT || 8001;

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
  key: fs.readFileSync(path.resolve('cert2/server.key')),
  cert: fs.readFileSync(path.resolve('cert2/server.crt'))
}

// Create secure server
const server = https.createServer(certOptions, app).listen(PORT, function() {
  console.log('Server listening at port: ', PORT);
});

// Tell server where to look for files
app.use(express.static('public'));

// Create socket connection
const io = require('socket.io').listen(server);


// Clients in the conductor namespace
const conductors = io.of('/conductor');
// Listen for output clients to connect
conductors.on('connection', function(socket) {
  console.log('A conductor client connected: ' + socket.id);

  // Listen for this output client to disconnect
  socket.on('disconnect', function() {
    console.log("A conductor client has disconnected " + socket.id);
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
    console.log("Received: 'message' " + data);

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
    conductors.emit('disconnected', socket.id);
  });
});
