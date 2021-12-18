import { Decimal } from 'decimal.js';
import { Currency, CurrencyDefinition, CurrencyError } from './currency';
import { isRecord } from './util';

export interface MoneyValue {
  amount: string | number;
  currency: string | CurrencyDefinition;
}

export interface NumberMap {
  [s: string]: number;
}
export interface MoneyMap {
  [s: string]: Money;
}

/**
 * Represents an amount of money in a specific currency.
 *
 * Ensures that currencies are not mixed and provides a sophisticated allocation method.
 *
 * Adapted from Martin Fowler's Money Pattern,
 * see Fowler, M. (2003) Patterns of Enterprise Application Architecture, pp. 488–495.
 *
 * Similar to https://github.com/macor161/ts-money but with a more convenient API for our purposes.
 * Implementation is based on decimal.js.
 */
export class Money {
  private readonly amount: Decimal;

  /**
   * A three-letter ISO 4217 code.
   */
  readonly currency: Currency;

  constructor(value: MoneyValue) {
    if (!value.currency) {
      throw new CurrencyError('Undefined currency');
    }

    this.currency = Currency.valueOf(value.currency);
    this.amount = new Decimal(value.amount).toDecimalPlaces(
      this.currency.exponent
    );
  }

  static valueOf(value: Money | MoneyValue): Money {
    if (value instanceof Money) {
      return value;
    }

    return new Money(value);
  }

  isZero(): boolean {
    return this.amount.isZero();
  }

  plus(value: Money | MoneyValue): Money {
    const another = Money.valueOf(value);
    this.checkSameCurrency(another);

    return this.withAmount(this.amount.plus(another.amount).toString());
  }

  minus(value: Money | MoneyValue): Money {
    const another = Money.valueOf(value);
    this.checkSameCurrency(another);

    return this.withAmount(this.amount.minus(another.amount).toString());
  }

  mul(multiplier: string | number): Money {
    return this.withAmount(this.amount.mul(multiplier).toString());
  }

  div(divider: string | number): Money {
    return this.withAmount(this.amount.div(divider).toString());
  }

  convertTo(
    currency: string | CurrencyDefinition,
    rate: string | number
  ): Money {
    return new Money({
      amount: this.amount.mul(rate).toFixed(this.currency.exponent),
      currency: currency,
    });
  }

  /**
   * Allocates the amount by the given ratios.
   *
   * Guarantees that no cents are lost in the allocation.
   *
   * @param ratios mapped by keys that also map corresponding allocations in the result
   */
  allocate(ratios: NumberMap): MoneyMap {
    const sumOfRatios = Object.values(ratios).reduce(
      (acc, ratio) => acc + ratio,
      0
    );

    if (sumOfRatios === 0) {
      if (!this.isZero()) {
        throw new Error('No ratios defined');
      }

      return Object.keys(ratios).reduce((acc: MoneyMap, key) => {
        acc[key] = this;
        return acc;
      }, {});
    }

    // Do the allocation with integers (i.e. minor currency units) because it's more simple
    const multiplier = 10 ** this.currency.exponent;
    const amountAsInt = this.amount.mul(multiplier).toNumber();

    // Store a rounding result for each key
    const remainders: { [s: string]: number } = {};

    // Results contains the allocations as integers
    const results: NumberMap = {};

    let remainder = amountAsInt;

    for (const [key, ratio] of Object.entries(ratios)) {
      const result = (amountAsInt * ratio) / sumOfRatios;
      results[key] = Math.floor(result);
      remainders[key] = Math.round(result) - results[key];
      remainder -= results[key];
    }

    // An improved version of the Fowler's algorithm. This takes rounding rules into account and
    // distributes the remainders more evenly, not just on the first keys.
    // It makes a difference when calculating accumulated allocations over several decades
    // where Fowler's version would build up leftovers always on the oldest assets.
    // e.g. allocating 1 with ratios [1, 2] should result in [0.33, 0.67], not [0.34, 0.66]
    for (const key of Object.keys(remainders)) {
      if (remainders[key] > 0 && remainder > 0) {
        results[key]++;
        remainder--;
      }
    }

    // Allocate the remainder in case something was left over from rounding all down,
    // e.g. allocating 1 with ratios [1, 1, 1] should result in [0.34, 0.33, 0.33]
    for (let i = 0; i < remainder; i++) {
      results[Object.keys(results)[i]]++;
    }

    return Object.keys(results).reduce((acc: MoneyMap, key) => {
      acc[key] = this.withAmount(results[key] / multiplier);
      return acc;
    }, {});
  }

  getAmount(): string {
    return this.amount.toFixed(this.currency.exponent);
  }

  getAmountAsNumber(): number {
    return this.amount.toNumber();
  }

  toJSON() {
    return {
      amount: this.amount.toFixed(this.currency.exponent),
      currency: this.currency.toJSON(),
    };
  }

  toString(): string {
    return `${this.amount.toFixed(this.currency.exponent)} ${this.currency}`;
  }

  formatAmount(
    decimalSeparator = ',',
    groupSeparator = '\xA0', // figure space
    minusSign = '\u2212'
  ): string {
    const [value, decimals] = this.amount
      .abs()
      .toFixed(this.currency.exponent)
      .split('.');

    return (
      (this.amount.isNegative() ? minusSign : '') +
      value.replace(/\d(?=(\d{3})+$)/g, '$&' + groupSeparator) +
      (decimals ? decimalSeparator + decimals : '')
    );
  }

  equals(another: unknown) {
    if (another === undefined || another === null) {
      return false;
    } else if (another instanceof Money) {
      return (
        this.amount.equals(another.amount) &&
        this.currency.equals(another.currency)
      );
    } else if (isRecord(another)) {
      return (
        this.toJSON().amount === another.amount &&
        this.currency.equals(another.currency)
      );
    } else {
      return false;
    }
  }

  /**
   * Throws an error if the currency of the given object does not equal to this object.
   *
   * @param another
   */
  private checkSameCurrency(another: Money | MoneyValue): void {
    if (!this.currency.equals(another.currency)) {
      throw new CurrencyError(
        `Expected a money object with currency ${this.currency} but got ${another.currency}`
      );
    }
  }

  /**
   * Returns a new Money object with the given amount.
   *
   * Retains the currency from this object.
   *
   * @param amount
   */
  private withAmount(amount: string | number): Money {
    return Money.valueOf({
      amount,
      currency: this.currency,
    });
  }
}
