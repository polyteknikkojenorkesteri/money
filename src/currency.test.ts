import { Currency, EUR, InvalidCurrencyError } from './currency';

describe('valueOf', () => {
  test('code string', () => {
    const currency = Currency.valueOf('EUR');
    expect(currency).toEqual(EUR);
  });

  test('custom definition', () => {
    const currency = Currency.valueOf({ code: 'XTS', exponent: 8 });
    expect(currency.code).toBe('XTS');
    expect(currency.exponent).toBe(8);
  });

  test('different exponents with same currency code', () => {
    const eur2 = Currency.valueOf({ code: 'EUR', exponent: 2 });
    const eur3 = Currency.valueOf({ code: 'EUR', exponent: 3 });
    expect(eur2.exponent).toBe(2);
    expect(eur3.exponent).toBe(3);
  });

  test('throws error on undefined', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(() => Currency.valueOf(undefined)).toThrow(InvalidCurrencyError);
  });

  test('throws error on null', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(() => Currency.valueOf(null)).toThrow(InvalidCurrencyError);
  });
});

describe('equals', () => {
  const currency = Currency.valueOf({ code: 'XTS', exponent: 2 });

  test('code and exponent equal', () => {
    expect(
      currency.equals(Currency.valueOf({ code: 'XTS', exponent: 2 }))
    ).toBeTruthy();
  });

  test('code not equal', () => {
    expect(
      currency.equals(Currency.valueOf({ code: 'EUR', exponent: 2 }))
    ).toBeFalsy();
  });

  test('exponent not equal', () => {
    expect(
      currency.equals(Currency.valueOf({ code: 'XTS', exponent: 3 }))
    ).toBeFalsy();
  });

  test('value undefined', () => {
    expect(currency.equals(undefined)).toBeFalsy();
  });

  test('value null', () => {
    expect(currency.equals(null)).toBeFalsy();
  });
});

describe('toString', () => {
  test('returns the three-letter ISO 4217 code', () => {
    const currency = Currency.valueOf('XTS');
    expect(currency.toString()).toBe('XTS');
  });
});
