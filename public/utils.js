// Speech stuff
let synth = window.speechSynthesis;
let voices = synth.getVoices();;
// Get voices asynchronously for Chrome
// Get voices asynchronously
window.speechSynthesis.onvoiceschanged = e => voices = synth.getVoices();

function speak(text, rate, pitch, volume, delay) {
  console.log("SPEAKING: ", text, rate, pitch, volume, delay);
  let sayThis = new SpeechSynthesisUtterance(text);
  sayThis.voice = voices[VOICE]; // or 10
  sayThis.rate = rate;
  sayThis.pitch = pitch;
  sayThis.volume = volume;

  // Delay the speech by some random amount
  if (delay) {
    setTimeout(() => {
      console.log("SPEAKING NOW: ", text);
      sayThis.rate = 2;
      synth.speak(sayThis);
    }, random(SPEECH_DELAY));
  } else synth.speak(sayThis);
}
