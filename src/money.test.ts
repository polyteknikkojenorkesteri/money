import { Currency, CurrencyError, DKK, EUR, JPY, USD } from './currency';
import { Money } from './money';

describe('valueOf', () => {
  test('rounds the amount to the correct number of decimals', () => {
    const eur3 = Currency.valueOf({ code: 'EUR', exponent: 3 });
    const money = Money.valueOf({ amount: 3.1415926536, currency: eur3 });
    expect(money.getAmount()).toBe('3.142');
  });
});

describe('plus', () => {
  test('adds amounts', () => {
    const money = Money.valueOf({ amount: 1, currency: EUR });
    expect(money.plus(money).getAmount()).toBe('2.00');
  });

  test('checks currencies match', () => {
    const money1 = Money.valueOf({ amount: 1, currency: EUR });
    const money2 = Money.valueOf({ amount: 1, currency: USD });
    expect(() => money1.plus(money2)).toThrow(CurrencyError);
  });
});

describe('minus', () => {
  test('subtracts amount', () => {
    const money = Money.valueOf({ amount: 1, currency: EUR });
    expect(money.minus(money).getAmount()).toBe('0.00');
  });

  test('checks currencies match', () => {
    const money1 = Money.valueOf({ amount: 1, currency: EUR });
    const money2 = Money.valueOf({ amount: 1, currency: USD });
    expect(() => money1.minus(money2)).toThrow(CurrencyError);
  });
});

describe('mul', () => {
  test('multiplies the amount with the given multiplier', () => {
    const money = Money.valueOf({ amount: 7, currency: EUR });
    expect(money.mul(1.52).getAmount()).toBe('10.64');
  });

  test('rounds the result to the correct number of decimals', () => {
    const eur3 = Currency.valueOf({ code: 'EUR', exponent: 3 });
    const money = Money.valueOf({ amount: 7, currency: eur3 });
    expect(money.mul(3.1415926536).getAmount()).toBe('21.991');
  });
});

describe('div', () => {
  test('divides the amount with the given divider', () => {
    const money = Money.valueOf({ amount: 6, currency: EUR });
    expect(money.div(2).getAmount()).toBe('3.00');
  });

  test('rounds the result to the correct number of decimals', () => {
    const eur3 = Currency.valueOf({ code: 'EUR', exponent: 3 });
    const money = Money.valueOf({ amount: 7, currency: eur3 });
    expect(money.div(6).getAmount()).toBe('1.167');
  });
});

describe('toJSON', () => {
  test('formats all decimals', () => {
    const money = Money.valueOf({ amount: 7, currency: EUR });
    expect(money.toJSON().amount).toBe('7.00');
  });

  test('formats rounded amount', () => {
    const money = Money.valueOf({
      amount: '1.1666666666666666667',
      currency: EUR,
    });
    expect(money.toJSON().amount).toBe('1.17');
  });

  test('formats amount with large exponent', () => {
    const money = Money.valueOf({
      amount: 15,
      currency: { code: 'XTS', exponent: 8 },
    });
    expect(money.toJSON().amount).toBe('15.00000000');
  });

  test('formats amount with zero exponent', () => {
    const money = Money.valueOf({
      amount: 120,
      currency: { code: 'XTS', exponent: 0 },
    });
    expect(money.toJSON().amount).toBe('120');
  });

  test('returns shorthand code for predefined currencies', () => {
    const money = Money.valueOf({ amount: 4.52, currency: DKK });
    expect(money.toJSON().currency).toBe('DKK');
  });

  test('returns object for other currencies', () => {
    const money = Money.valueOf({
      amount: 120,
      currency: { code: 'XTS', exponent: 0 },
    });
    expect(money.toJSON().currency).toEqual({
      code: 'XTS',
      exponent: 0,
    });
  });
});

describe('allocate', () => {
  describe('empty ratios', () => {
    const money = Money.valueOf({ amount: '10.00', currency: 'EUR' });

    test('throws error', () => {
      expect(() => money.allocate({})).toThrow('No ratios defined');
    });
  });

  describe('one ratio', () => {
    const money = Money.valueOf({ amount: '10.00', currency: 'EUR' });
    const allocations = money.allocate({
      '2019/001': 1,
    });

    test('allocates amounts according to the given ratios', () => {
      expect(allocations['2019/001'].getAmount()).toBe('10.00');
    });
  });

  describe('two ratios', () => {
    const money = Money.valueOf({ amount: '10.00', currency: 'EUR' });
    const allocations = money.allocate({
      '2019/001': 5,
      '2019/002': 2,
    });

    test('allocates amounts according to the given ratios', () => {
      expect(allocations['2019/001'].getAmount()).toBe('7.14');
      expect(allocations['2019/002'].getAmount()).toBe('2.86');
    });
  });

  describe('three ratios', () => {
    const money = Money.valueOf({ amount: '10.00', currency: 'EUR' });
    const allocations = money.allocate({
      '2019/001': 3,
      '2019/002': 3,
      '2019/003': 3,
    });

    test('allocates amounts according to the given ratios', () => {
      expect(allocations['2019/001'].getAmount()).toBe('3.34');
      expect(allocations['2019/002'].getAmount()).toBe('3.33');
      expect(allocations['2019/003'].getAmount()).toBe('3.33');
    });
  });

  describe('remainder distribution', () => {
    const money = Money.valueOf({ amount: '1.00', currency: 'EUR' });
    const allocations = money.allocate({ 0: 1, 1: 2 });

    // The original Fowler's algorithm would always place the remaining cent on the first
    // allocation (i.e. would result in [0: 0.34, 1: 0.66]), but our algorithm places it where
    // it would go if the amounts were rounded separately
    test('allocates the remainder per rounding rules', () => {
      expect(allocations[0].getAmount()).toBe('0.33');
      expect(allocations[1].getAmount()).toBe('0.67');
    });
  });

  describe("solving Foemmel's Conundrum", () => {
    const money = Money.valueOf({ amount: '0.05', currency: 'EUR' });
    const allocations = money.allocate({ 0: 3, 1: 7 });

    test('puts the remainder on the first allocation', () => {
      expect(allocations[0].getAmount()).toBe('0.02');
      expect(allocations[1].getAmount()).toBe('0.03');
    });
  });

  describe('zero ratio alone', () => {
    test('throws an error if amount > 0', () => {
      const money = Money.valueOf({ amount: '1.00', currency: 'EUR' });
      expect(() => money.allocate({ 0: 0 })).toThrow('No ratios defined');
    });

    test('returns zero if amount is zero', () => {
      const money = Money.valueOf({ amount: '0.00', currency: 'EUR' });
      const allocations = money.allocate({ 0: 0 });

      expect(allocations[0].getAmount()).toBe('0.00');
    });
  });

  describe('zero ratio with others', () => {
    const money = Money.valueOf({ amount: '1.00', currency: 'EUR' });
    const allocations = money.allocate({ 0: 0, 1: 1, 2: 2 });

    test('returns zero amount', () => {
      expect(allocations[0].getAmount()).toBe('0.00');
    });

    test('does not affect others', () => {
      expect(allocations[1].getAmount()).toBe('0.33');
      expect(allocations[2].getAmount()).toBe('0.67');
    });
  });
});

describe('convert', () => {
  const money1 = Money.valueOf({ amount: '5.20', currency: 'EUR' });
  const money2 = money1.convertTo('USD', 1.120931);

  test('currency', () => {
    expect(money2.currency.code).toBe('USD');
  });

  test('converts with the given rate', () => {
    expect(money2.getAmount()).toBe('5.83');
  });
});

describe('equals', () => {
  const money = Money.valueOf({ amount: 12.3, currency: EUR });

  test('amount and currency equal', () => {
    expect(
      money.equals(Money.valueOf({ amount: 12.3, currency: EUR }))
    ).toBeTruthy();
  });

  test('amount not equal', () => {
    expect(money.equals(Money.valueOf({ amount: 5, currency: EUR }))).toBe(
      false
    );
  });

  test('currency not equal', () => {
    expect(
      money.equals(Money.valueOf({ amount: 12.3, currency: USD }))
    ).toBeFalsy();
  });

  test('value undefined', () => {
    expect(money.equals(undefined)).toBeFalsy();
  });

  test('value null', () => {
    expect(money.equals(null)).toBeFalsy();
  });
});

describe('getAmount', () => {
  test('returns a string with two decimals', () => {
    const money = Money.valueOf({ amount: 1, currency: EUR });
    expect(money.getAmount()).toBe('1.00');
  });

  test('returns a string with three decimals', () => {
    const money = Money.valueOf({
      amount: 1,
      currency: { code: 'EUR', exponent: 3 },
    });
    expect(money.getAmount()).toBe('1.000');
  });

  test('returns a string with zero decimals', () => {
    const money = Money.valueOf({ amount: 100, currency: JPY });
    expect(money.getAmount()).toBe('100');
  });
});

describe('getAmountAsNumber', () => {
  test('returns a number', () => {
    const money = Money.valueOf({ amount: 1.23, currency: EUR });
    expect(money.getAmountAsNumber()).toBe(1.23);
  });
});

describe('toString', () => {
  const money = Money.valueOf({ amount: 12.3, currency: EUR });

  test('returns a string representation', () => {
    expect(money.toString()).toBe('12.30 EUR');
  });
});

describe('formatAmount', () => {
  test('formats the amount without currency symbol', () => {
    const value = new Money({ amount: '10.14', currency: EUR });
    expect(value.formatAmount()).toBe('10,14');
  });

  test('figure space as the default group separator', () => {
    const value = new Money({ amount: '2310.14', currency: EUR });
    expect(value.formatAmount()).toBe('2\xA0310,14');
  });

  test('group separator also with larger values', () => {
    const value = new Money({ amount: '4645231.00', currency: EUR });
    expect(value.formatAmount()).toBe('4\xA0645\xA0231,00');
  });

  test('separates groups with zero exponent', () => {
    const value = new Money({
      amount: 2310,
      currency: { code: 'XTS', exponent: 0 },
    });
    expect(value.formatAmount()).toBe('2\xA0310');
  });

  test('formats the minus sign', () => {
    const value = new Money({ amount: '-1.00', currency: EUR });
    expect(value.formatAmount()).toBe('\u22121,00');
  });

  test('prints all decimals', () => {
    const money = Money.valueOf({ amount: 7, currency: EUR });
    expect(money.formatAmount()).toBe('7,00');
  });

  test('formats rounded amount', () => {
    const money = Money.valueOf({
      amount: '1.1666666666666666667',
      currency: EUR,
    });
    expect(money.formatAmount()).toBe('1,17');
  });

  test('formats amount with large exponent', () => {
    const money = Money.valueOf({
      amount: 15,
      currency: { code: 'XTS', exponent: 8 },
    });
    expect(money.formatAmount()).toBe('15,00000000');
  });

  test('formats amount with zero exponent', () => {
    const money = Money.valueOf({
      amount: 120,
      currency: { code: 'XTS', exponent: 0 },
    });
    expect(money.formatAmount()).toBe('120');
  });

  test('formats the amount with custom decimal separator', () => {
    const value = new Money({ amount: '10.14', currency: EUR });
    expect(value.formatAmount('.')).toBe('10.14');
  });

  test('custom group separator', () => {
    const value = new Money({ amount: '2310.14', currency: EUR });
    expect(value.formatAmount(',', '.')).toBe('2.310,14');
  });
});
