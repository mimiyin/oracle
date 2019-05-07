// Open and connect output socket
let socket = io('/output');

// Listen for confirmation of connection
socket.on('connect', function() {
  console.log("Connected");
});

// Keep track of users
let users = {};

// Recordings
let yes = [];
let no = [];
let roles = [yes, no];
let r = 0;
const FONT_SCL = 512;

// Positioning
let center;
let m;



function preload() {


  yes.push(new Word("yes.wav", "Yes", 0.1));
  yes.push(new Word("probably.wav", "Probably", 0.1));
  yes.push(new Word("maybe.wav", "Maybe", 0.1));
  no.push(new Word("never.wav", "Never", 0.1));
  no.push(new Word("no.wav", "No", 0.1));
  no.push(new Word("maybe.wav", "Maybe", 0.1));
}

function createNewUser(id) {
  users[id] = roles[r % roles.length];
  return users[id];
}

function setup() {
  //createCanvas(windowWidth, windowHeight);
  noCanvas();
  background(255);

  // Positioning
  center = createVector(windowWidth / 2, windowHeight / 2);
  m = windowWidth/10;

  // Listen for drip data from server
  socket.on('tilt', function(message) {
    //console.log(message);
    let id = message.id;
    let data = message.data;
  });

  // Listen for blop data from server
  socket.on('shake', function(message) {
    let id = message.id;
    let user = users[id] || createNewUser(id);
    //let trying = true;
    //while (trying) {
    let word = user[floor(random(user.length))];
    //if(word.isPlaying) continue;
    word.play();
    //trying = false;
    //}
  });

  // Remove disconnected users
  socket.on('disconnected', function(id) {
    delete users[id];
  });

  // Background color
  let body = select('body');
  let bg = createVector(random(255), random(255), random(255));
  let bgspeed = createVector(0.1, 0.125, 0.15);
  setInterval(()=>{
    bg.add(bgspeed);
    // Bounce
    for(let c in bg) {
      if(bg[c] < 0 || bg[c] > 255) bgspeed[c] *= -1;
    }
    body.style('background-color', 'rgba(' + bg.x + ',' + bg.y + ',' + bg.z + ',1)');
  }, 10);
}

function keyPressed() {
  let id = 'ID_' + floor(random(1, 10));
  let user = id in users ? users[id] : createNewUser(id);
  let word = user[floor(random(user.length))];
  word.play();
}
