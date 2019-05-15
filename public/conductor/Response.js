class Response {
  constructor(soundfile, text, tspeed) {
    this.soundfile = loadSound(soundfile);
  }

  play() {
    this.soundfile.play();
  }
}
