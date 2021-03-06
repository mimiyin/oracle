// Open and connect output socket
let socket = io('/chorus');

// Listen for confirmation of connection
socket.on('connect', function() {
  console.log("Connected");
});

// Rate of speech
let rate = 0.8;
let speaking = false;

function setup() {
  noCanvas();

  // Container for spoken queries
  let body = select('body');

  // Listen for blop data from server
  socket.on('query', (query) => {
    // Code to utter the string with the right computer voice
    console.log("SAY IT: ", query);
    let qds = selectAll('.query');
    for (let qd of qds) qd.remove();
    let queryDiv = createDiv(query).addClass('query');
    // Size the font to the screen
    let fs = 0;

    function scaleFS(el) {
      // Set font-size on element
      function setFS() {
        el.style('font-size', fs + 'px');
      }

      // Don't size on height for url
      // Make sure it fits height-wise
      while (el.size().height < windowHeight) {
        fs++;
        setFS();
      }
      fs--;
      setFS();

      //Then make sure it fits width-wise
      while (el.size().width > windowWidth) {
        fs--;
        setFS()
      }

      el.addClass('fullscreen');
    }
    // Scale font-size
    scaleFS(queryDiv);
    // Make it green
    body.addClass('chartreuse');
    // Remove query after a certain about of time
    setTimeout(() => {
      queryDiv.remove();
      body.removeClass('chartreuse');
    }, QUERY_TS);


    // Say it
    if (speaking) speak(query, rate, 1, 1, true);
  });

  // Cue scenes
  socket.on('cue', (scene) => {
    console.log("SCENE: ", scene);
    // Don't speak queries during intro
    speaking = scene != 'wait';
    if (scene == 'end') createDiv("The end.").addClass('end').addClass('fullscreen');
    else try {
      select('.end').remove();
    } catch (e) {
      console.log("NOT ENDED YET")
    };
  });

  // Cue rate
  socket.on('rate', (r) => {
    console.log("NEW RATE: ", r);
    rate = r;
  })
}

// Keypress to choose voice
function keyPressed() {
  switch (key) {
    case '1':
      VOICE = VOICE_CHROME;
      break;
    case '2':
      VOICE = VOICE_SAFARI;
      break;
  }

  console.log("VOICE: ", VOICE);
}
