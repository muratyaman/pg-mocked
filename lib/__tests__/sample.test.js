const { expect } = require('chai');
const { Pool } = require('pg');
const { PgMocked } = require('../');

const sqlProducts = 'select id, name from products';
const sqlProduct  = 'select id, name from products where id = $1';

class MyApp {
  constructor(pool) {
    this.pool = pool;
  }

  async getProducts() {
    const { rows } = await this.pool.query(sqlProducts);
    return rows;
  }

  async getProduct(id = 0) {
    const { rows } = await this.pool.query(sqlProduct, [id]);
    return rows.length ? rows[0] : null;
  }

  async useInvalidSql() {
    return this.pool.query('select invalid');
  }
}

class Product {
  id = 0
  name = '';
  constructor(id = 0, name = '') {
    this.id = id;
    this.name = name;
  }
}

const productListReal = [
  new Product(1, 'Apple'),
];

const productListFake = [
  new Product(1, 'Orange'),
  new Product(2, 'Grape'),
];

describe('my app', () => {

  it('should get products using data from real database', async () => {
    const pool = new Pool({ connectionString: 'postgres://haci@localhost:5432/test' });
    const app = new MyApp(pool);
    const result = await app.getProducts();
    expect(result.length).to.eq(1);
    expect(result[0].id).to.eq(productListReal[0].id);
    expect(result[0].name).to.eq(productListReal[0].name);
    await pool.end();
  });

  it('should get products without getting any data from database', async () => {

    const pgMocked = new PgMocked({ connectionString: 'postgres://haci@localhost:5432/test' });
    // TODO: if app relies on more details like rowCount, fields, etc. we can provide that info in fake result
    const expectedResult = {
      rows: productListFake,
      //rowCount: 1,
      //command: 'SELECT',
      //oid: 1,
      //fields: [
      //  { tableID: 1, columnID: 1, dataTypeID: 1, dataTypeModifier: 1, dataTypeSize: 1, name: 'id', format: 'text' },
      //  { tableID: 1, columnID: 2, dataTypeID: 2, dataTypeModifier: 2, dataTypeSize: 2, name: 'name', format: 'text' },
      //],
    };
    pgMocked.when(sqlProducts, [], expectedResult);

    const app = new MyApp(pgMocked);
    const result = await app.getProducts();
    expect(result.length).to.eq(2);
    expect(result[0].id).to.eq(productListFake[0].id);
    expect(result[0].name).to.eq(productListFake[0].name);
    await pgMocked.end();
  });

  it('should get product without getting any data from database', async () => {

    const pgMocked = new PgMocked({ connectionString: 'postgres://haci@localhost:5432/test' });

    const expectedResult1 = {
      rows: [ productListFake[0] ],
    };
    pgMocked.when(sqlProduct, [1], expectedResult1);

    const expectedResult2 = {
      rows: [ productListFake[1] ],
    };
    pgMocked.whenOnce(sqlProduct, [2], expectedResult2);

    const app = new MyApp(pgMocked);

    const result1 = await app.getProduct(1);
    expect(result1.id).to.eq(productListFake[0].id);
    expect(result1.name).to.eq(productListFake[0].name);

    const result2 = await app.getProduct(2);
    expect(result2.id).to.eq(productListFake[1].id);
    expect(result2.name).to.eq(productListFake[1].name);

    const result3 = await app.getProduct(2);
    expect(result3).to.eq(null);

    let errInvalidSql = null;
    try {
      await app.useInvalidSql();
    } catch (err) {
      errInvalidSql = err;
    }
    expect(errInvalidSql !== null).to.eq(true);

    await pgMocked.end();
  });

});
