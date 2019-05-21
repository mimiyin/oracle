
class Round {
  constructor(rname, rates){
    this.name = rname;
    this.parts = [];
    for(let p = 0; p < 4; p++) {
      this.parts.push(new Part(rates[p]));
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
  constructor(rate){
    this.rate = rate;
    this.queries = [];
  }

  addQuery(query) {
    this.queries.push(query);
  }

  getQueries() {
    return this.queries;
  }
}
