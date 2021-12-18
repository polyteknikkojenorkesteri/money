import { isRecord } from './util';

export class InvalidCurrencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCurrencyError';
  }
}

export interface CurrencyDefinition {
  code: string;
  exponent: number;
}

/**
 * An internal cache for Currency.valueOf()
 */
const currencies: { [s: string]: Currency } = {};

/**
 * Represents an ISO 4217 currency.
 */
export class Currency implements CurrencyDefinition {
  /**
   * A three-letter ISO 4217 code.
   */
  readonly code: string;

  /**
   * Number of digits after the decimal separator, varies between different currencies.
   */
  readonly exponent: number;

  constructor(value: CurrencyDefinition) {
    this.code = value.code;
    this.exponent = value.exponent;
  }

  static valueOf(value: string | CurrencyDefinition): Currency {
    if (value === undefined || value === null) {
      throw new InvalidCurrencyError(`Invalid currency '${value}'`);
    }

    if (typeof value === 'string') {
      if (!currencies[value]) {
        currencies[value] = new Currency({ code: value, exponent: 2 });
      }

      return currencies[value];
    } else {
      // Use a complex key just in case different exponents of the same currency were needed
      const key = JSON.stringify(value);
      if (!currencies[key]) {
        currencies[key] = new Currency(value);
      }

      return currencies[key];
    }
  }

  toJSON(): string | CurrencyDefinition {
    return currencies[this.code] && currencies[this.code].equals(this)
      ? this.code
      : {
          code: this.code,
          exponent: this.exponent,
        };
  }

  toString(): string {
    return this.code;
  }

  equals(another: unknown): boolean {
    if (another === undefined || another === null) {
      return false;
    } else if (typeof another === 'string') {
      return this.code === another;
    } else if (isRecord(another)) {
      return this.code === another.code && this.exponent === another.exponent;
    } else {
      return false;
    }
  }
}

// We could define all codes here if this was a generic library,
// but we're not going to need them just for our purposes
export const EUR = (currencies.EUR = new Currency({
  code: 'EUR',
  exponent: 2,
}));
export const USD = (currencies.USD = new Currency({
  code: 'USD',
  exponent: 2,
}));
export const FIM = (currencies.FIM = new Currency({
  code: 'FIM',
  exponent: 2,
}));
export const DKK = (currencies.DKK = new Currency({
  code: 'DKK',
  exponent: 2,
}));
export const JPY = (currencies.JPY = new Currency({
  code: 'JPY',
  exponent: 0,
})); // Just to demonstrate the exponent

export class CurrencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CurrencyError';
  }
}
