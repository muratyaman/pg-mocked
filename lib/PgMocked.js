const { Pool } = require('pg');
const hash = require('string-hash');

class PgMocked extends Pool {
  expected = {};

  when(text = '', values = [], result = []) {
    const name = makeName(text, values);
    this.expected[name] = new Expectation(result, false);
  }

  whenOnce(text = '', values = [], result = []) {
    const name = makeName(text, values);
    this.expected[name] = new Expectation(result, true);
  }

  async query(text = '', values = []) {
    const name = makeName(text, values);
    const _text = 'EXPLAIN ' + text;
    try {
      // just to check SQL
      await super.query(_text, values); 
    } catch (err) {
      console.error('PgMocked: error in ' + _text + ' - ' + err.message);
      throw err;
    }
    if (name in this.expected) {
      const { result, once = false } = this.expected[name];
      if (once) delete this.expected[name];
      return result;
    }
    console.error('PgMocked: no match for query: ' + JSON.stringify({ text, values }));
    return { rows: [], rowCount: 0 };
  }
}

function makeName(text, values) {
  return 'qry-' + hash(text + '--' + JSON.stringify(values));
}

class Expectation {
  constructor(result, once) {
    this.result = result;
    this.once = once;
  }
}

module.exports = {
  PgMocked,
  Expectation,
};
