// Open and connect input socket
let socket = io('/oracle');
let count = 0;

// Listen for confirmation of connection
socket.on('connect', function() {
  console.log("Connected");
});

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER);
}

function draw(){
  background('black');
  // Cound to debounce
  count++;
}

// Calculate size of shake
// Send data
function deviceShaken() {
  if(count < 60) return;
  let force = abs(accelerationX-pAccelerationX) + abs(accelerationY-pAccelerationY);
  socket.emit('shake', force);
  count = 0;
  background('red');
}
