class Response {
  constructor(soundfile, text, tspeed) {
    this.soundfile = loadSound(soundfile, ()=>console.log("LOADED: " + text));
  }

  play() {
    this.soundfile.play();
  }
}
