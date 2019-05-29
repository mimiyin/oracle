
class Round {
  constructor(rname){
    this.name = rname;
    this.parts = [];
    for(let p = 0; p < NUM_PARTS; p++) {
      this.parts.push(new Part());
    }
  }

  addQuery(p, query) {
    this.parts[p].addQuery(query);
  }

  getParts() {
    return this.parts;
  }

  getPart(p) {
    return this.parts[p];
  }

}

class Part {
  constructor(){
    this.queries = [];
  }
  setRate(rate) {
    this.rate = rate;
  }
  addQuery(query) {
    this.queries.push(query);
  }

  getQueries() {
    return this.queries;
  }
}
