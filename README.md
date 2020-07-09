# Money

![.github/workflows/ci.yaml](https://github.com/polyteknikkojenorkesteri/money/workflows/.github/workflows/ci.yaml/badge.svg)

This project provides a `Money` class to tackle several challanges related to handling money in code. First, it avoids using floats because of rounding errors. Second, it checks that currencies are never mixed. Third, it uses an allocation algorithm to ensure that no cents are lost in allocations and currency conversions.

This class is based on Martin Fowler's [Money Pattern](https://martinfowler.com/eaaCatalog/money.html), see Fowler, M. (2003) Patterns of Enterprise Application Architecture, pp. 488–495. The borrowed allocation algorithm was improved to take rounding rules into account and to distribute remainders more evenly, where Fowler's version would build up leftovers always on the oldest assets. This makes a difference when we calculate the accumulated allocations over several decades.

Our `Money` class is similar to [ts-money](https://github.com/macor161/ts-money) but with a more convenient API for our purposes. Internally, this implementation uses [decimal.js](https://github.com/MikeMcl/decimal.js). 

## Development

It works at least on Node.js 12 runtime, and should also work on newer versions of Node.js as well.

### Unit Tests

All the functionality is pretty much covered with unit tests written with [Mocha](https://mochajs.org/) and [Chai](https://www.chaijs.com/). Execute the tests by running `npm test`.

### Build

Build the library by running the following commands.

```
npm install
npm run build
```
