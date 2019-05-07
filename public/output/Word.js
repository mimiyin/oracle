class Word {
  constructor(soundfile, text, tspeed) {
    this.soundfile = loadSound(soundfile);
    this.text = text;
    this.easing = ease.easeOutQuint;
    this.tspeed = tspeed;
    this.clear();
  }

  play() {
    this.soundfile.play();
    this.display();
  }

  grow(easing) {
    if(this.t > 1) this.tspeed *= -1;
    let sz = this.easing(this.t += this.tspeed)*FONT_SCL || 0;
    sz = max(0, sz);
    //this.word.style('font-size', sz + 'px');
    if (this.t <= -0.1) this.clear();
  }

  clear() {
    clearInterval(this.interval);
    this.t = 0;
    this.tspeed = abs(this.tspeed);
    if(this.container) this.container.remove();
  }

  display() {

    // Create and display the word
    this.clear();
    this.word = createP(this.text);
    this.container = createDiv('');
    this.container.child(this.word);
    this.container.style('left', center.x + 'px')
    this.container.style('top', center.y + 'px');

    // this.container.style('left', (center.x + random(-m, 0)) + 'px')
    // this.container.style('top', (center.y + random(-m, 0)) + 'px');
    // Create animation
    this.interval = setInterval(() => this.grow(), 10);

  }
}
