# pg-mocked

package to speed up automated tests that rely on node pg for postgresql databases

## requirements

* Node.js

## installation

```sh
npm i
```

## usage

See `__tests__` folder.

```sh
npm run test
```

```js
// realistic code
const pool = new Pool({ connectionString: 'postgres://haci@localhost:5432/test' });
const app = new MyApp(pool);
const result = await app.getProducts();
```

```js
// with semi-mocking, connects to db, verifies sql but it does not get actual data from db
const pgMocked = new PgMocked({ connectionString: 'postgres://haci@localhost:5432/test' });
const expectedResult = { rows: productListFake };
pgMocked.when(sqlProducts, [], expectedResult); // when we receive query and parameters return expectedResult
// pgMocked.whenOnce(sqlProducts, [], expectedResult); // or mock once
const app = new MyApp(pgMocked);
const result = await app.getProducts();
expect(result.length).to.eq(2);
expect(result[0].id).to.eq(productListFake[0].id);
```
