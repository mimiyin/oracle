class Response {
  constructor(text) {
    this.text = text;
  }

  // Response speak
  speak() {
    // Code to utter the string with the right computer voice
    // Let oracle respond
    last_asked = millis();
    console.log("SAY IT: " + query);
    let sayThis = new SpeechSynthesisUtterance(query);
    sayThis.voice = voices[40]; // or 10
    sayThis.rate = random(0.6, 1.2);
    sayThis.pitch = random(0.6, 1.2);
    synth.speak(sayThis);
  }
}
