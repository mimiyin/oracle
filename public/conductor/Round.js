
class Round {
  constructor(name, p_names){
    this.name = name;
    this.parts = [];
    for(let p = 0; p < 4; p++) {
      this.parts.push(new Part(p_names[p]));
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
