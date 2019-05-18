
class Round {
  constructor(pname){
    this.parts = [];
    for(let p = 0; p < 4; p++) {
      this.parts.push(new Part(pname));
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
  constructor(name){
    this.name = name;
    this.queries = [];
  }

  addQuery(query) {
    this.queries.push(query);
  }

  getQueries() {
    return this.queries;
  }
}
