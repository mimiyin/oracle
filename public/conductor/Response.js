class Response {
  constructor(text) {
    this.text = text;
  }

  // Response speak
  speak() {
    // Code to utter the string with the right computer voice
    // Let oracle respond
    console.log("RESPOND: " + this.text);
    let rate = random(0.6, 1.2);
    let pitch = random(0.8, 1.2);
    speak(this.text, rate, pitch, DEFAULT_VOLUME, false);
  }
}
