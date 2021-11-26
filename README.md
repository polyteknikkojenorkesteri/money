# Money

![.github/workflows/ci.yaml](https://github.com/polyteknikkojenorkesteri/money/workflows/.github/workflows/ci.yaml/badge.svg)

This project provides a `Money` class to tackle several challanges related to handling money in code. First, it avoids using floats because of rounding errors. Second, it checks that currencies are never mixed. Third, it uses an allocation algorithm to ensure that no cents are lost in allocations and currency conversions.

This class is based on Martin Fowler's [Money Pattern](https://martinfowler.com/eaaCatalog/money.html), see Fowler, M. (2003) Patterns of Enterprise Application Architecture, pp. 488–495. The borrowed allocation algorithm was improved to take rounding rules into account and to distribute remainders more evenly, where Fowler's version would build up leftovers always on the oldest assets. This makes a difference when we calculate the accumulated allocations over several decades.

Our `Money` class is similar to [ts-money](https://github.com/macor161/ts-money) but with a more convenient API for our purposes. Internally, this implementation uses [decimal.js](https://github.com/MikeMcl/decimal.js).

## Development

Works at least on Node.js 14 runtime and newer.

### Unit Tests

Test cases use [Jest](https://jestjs.io/) framework. This project includes unit tests and integration tests.

Unit tests are named after the component being tested, and the filenames end in `.test.ts`. Unit tests are put into the source directory. For example, for module `money.ts`, the tests are located in `src/money.test.js`.

Tests can be run once or continuously during the development.

```
# Run once
npm test

# Watch files and run tests when the code is modified
npm run test:watch
```

### Build

Build the library by running the following commands.

```
npm install
npm run build
```

### Code Style

This repository uses [Prettier](https://prettier.io/) for automatic code formatting.

Make sure all files are formatted before commit by running

```
npm run prettier
```

For the best developer experience, enable Prettier on save in your IDE.
