import {Currency, CurrencyError, DKK, EUR, InvalidCurrencyError, Money, USD} from './index';
import {expect} from 'chai';

describe('Currency', () => {
  describe('valueOf', () => {
    it('should accept a code string', () => {
      const currency = Currency.valueOf('EUR');
      expect(currency).to.deep.eq(EUR);
    });

    it('should accept a custom definition', () => {
      const currency = Currency.valueOf({code: 'XTS', exponent: 8});
      expect(currency.code).to.eq('XTS');
      expect(currency.exponent).to.eq(8);
    });

    it('should support different exponents with same currency code', () => {
      const eur2 = Currency.valueOf({code: 'EUR', exponent: 2});
      const eur3 = Currency.valueOf({code: 'EUR', exponent: 3});
      expect(eur2.exponent).to.eq(2);
      expect(eur3.exponent).to.eq(3);
    });

    it('should throw error on undefined', () => {
      // @ts-ignore
      expect(() => Currency.valueOf(undefined)).to.throw(InvalidCurrencyError);
    });

    it('should throw error on null', () => {
      // @ts-ignore
      expect(() => Currency.valueOf(null)).to.throw(InvalidCurrencyError);
    });
  });

  describe('equals', () => {
    const currency = Currency.valueOf({code: 'XTS', exponent: 2});

    it('should return true if code and exponent equal', () => {
      expect(currency.equals(Currency.valueOf({code: 'XTS', exponent: 2}))).to.eq(true);
    });

    it('should return false if code not equal', () => {
      expect(currency.equals(Currency.valueOf({code: 'EUR', exponent: 2}))).to.eq(false);
    });

    it('should return false if exponent not equal', () => {
      expect(currency.equals(Currency.valueOf({code: 'XTS', exponent: 3}))).to.eq(false);
    });

    it('should return false if value is undefined', () => {
      expect(currency.equals(undefined)).to.eq(false);
    });

    it('should return false if value is null', () => {
      expect(currency.equals(null)).to.eq(false);
    });
  });

  describe('toString', () => {
    it('should return the three-letter ISO 4217 code', () => {
      const currency = Currency.valueOf('XTS');
      expect(currency.toString()).to.eq('XTS');
    });
  });
});

describe('Money', () => {
  describe('valueOf', () => {
    it('should round the amount to the correct number of decimals', () => {
      const eur3 = Currency.valueOf({code: 'EUR', exponent: 3});
      const money = Money.valueOf({amount: 3.1415926536, currency: eur3});
      expect(money.amount.toString()).to.eq('3.142');
    });
  });

  describe('plus', () => {
    it('should add amounts', () => {
      const money = Money.valueOf({amount: 1, currency: EUR});
      expect(money.plus(money).amount.toNumber()).to.eq(2);
    });

    it('should check that currencies match', () => {
      const money1 = Money.valueOf({amount: 1, currency: EUR});
      const money2 = Money.valueOf({amount: 1, currency: USD});
      expect(() => money1.plus(money2)).to.throw(CurrencyError);
    });
  });

  describe('minus', () => {
    it('should subtract amount', () => {
      const money = Money.valueOf({amount: 1, currency: EUR});
      expect(money.minus(money).amount.toNumber()).to.eq(0);
    });

    it('should check that currencies match', () => {
      const money1 = Money.valueOf({amount: 1, currency: EUR});
      const money2 = Money.valueOf({amount: 1, currency: USD});
      expect(() => money1.minus(money2)).to.throw(CurrencyError);
    });
  });

  describe('mul', () => {
    it('should multiply the amount with the given multiplier', () => {
      const money = Money.valueOf({amount: 7, currency: EUR});
      expect(money.mul(1.52).amount.toString()).to.eq('10.64');
    });

    it('should round the result to the correct number of decimals', () => {
      const eur3 = Currency.valueOf({code: 'EUR', exponent: 3});
      const money = Money.valueOf({amount: 7, currency: eur3});
      expect(money.mul(3.1415926536).amount.toString()).to.eq('21.991');
    });
  });

  describe('div', () => {
    it('should divide the amount with the given divider', () => {
      const money = Money.valueOf({amount: 6, currency: EUR});
      expect(money.div(2).amount.toString()).to.eq('3');
    });

    it('should round the result to the correct number of decimals', () => {
      const eur3 = Currency.valueOf({code: 'EUR', exponent: 3});
      const money = Money.valueOf({amount: 7, currency: eur3});
      expect(money.div(6).amount.toString()).to.eq('1.167');
    });
  });

  describe('toJSON', () => {
    it('should format all decimals', () => {
      const money = Money.valueOf({amount: 7, currency: EUR});
      expect(money.toJSON().amount).to.eq('7.00');
    });

    it('should format rounded amount', () => {
      const money = Money.valueOf({amount: '1.1666666666666666667', currency: EUR});
      expect(money.toJSON().amount).to.eq('1.17');
    });

    it('should format amount with large exponent', () => {
      const money = Money.valueOf({amount: 15, currency: {code: 'XTS', exponent: 8}});
      expect(money.toJSON().amount).to.eq('15.00000000');
    });

    it('should format amount with zero exponent', () => {
      const money = Money.valueOf({amount: 120, currency: {code: 'XTS', exponent: 0}});
      expect(money.toJSON().amount).to.eq('120');
    });

    it('should format the currency code', () => {
      const money = Money.valueOf({amount: 4.52, currency: DKK});
      expect(money.toJSON().currency).to.eq('DKK');
    });
  });

  describe('allocate', () => {
    describe('empty ratios', () => {
      const money = Money.valueOf({amount: '10.00', currency: 'EUR'});

      it('should throw error', () => {
        expect(() => money.allocate({})).to.throw('No ratios defined');
      });
    });

    describe('one ratio', () => {
      const money = Money.valueOf({amount: '10.00', currency: 'EUR'});
      const allocations = money.allocate({
        '2019/001': 1
      });

      it('should allocate amounts according to the given ratios', () => {
        expect(allocations['2019/001'].amount.toString()).to.eq('10');
      });
    });

    describe('two ratios', () => {
      const money = Money.valueOf({amount: '10.00', currency: 'EUR'});
      const allocations = money.allocate({
        '2019/001': 5,
        '2019/002': 2
      });

      it('should allocate amounts according to the given ratios', () => {
        expect(allocations['2019/001'].amount.toString()).to.eq('7.14');
        expect(allocations['2019/002'].amount.toString()).to.eq('2.86');
      });
    });

    describe('three ratios', () => {
      const money = Money.valueOf({amount: '10.00', currency: 'EUR'});
      const allocations = money.allocate({
        '2019/001': 3,
        '2019/002': 3,
        '2019/003': 3
      });

      it('should allocate amounts according to the given ratios', () => {
        expect(allocations['2019/001'].amount.toString()).to.eq('3.34');
        expect(allocations['2019/002'].amount.toString()).to.eq('3.33');
        expect(allocations['2019/003'].amount.toString()).to.eq('3.33');
      });
    });

    describe('remainder distribution', () => {
      const money = Money.valueOf({amount: '1.00', currency: 'EUR'});
      const allocations = money.allocate({0: 1, 1: 2});

      // The original Fowler's algorithm would always place the remaining cent on the first
      // allocation (i.e. would result in [0: 0.34, 1: 0.66]), but our algorithm places it where
      // it would go if the amounts were rounded separately
      it('should allocate the remainder per rounding rules', () => {
        expect(allocations[0].amount.toString()).to.eq('0.33');
        expect(allocations[1].amount.toString()).to.eq('0.67');
      });
    });

    describe("solving Foemmel's Conundrum", () => {
      const money = Money.valueOf({amount: '0.05', currency: 'EUR'});
      const allocations = money.allocate({0: 3, 1: 7});

      it('should put the remainder on the first allocation', () => {
        expect(allocations[0].amount.toString()).to.eq('0.02');
        expect(allocations[1].amount.toString()).to.eq('0.03');
      });
    });

    describe('zero ratio alone', () => {
      it('should throw an error if amount > 0', () => {
        const money = Money.valueOf({amount: '1.00', currency: 'EUR'});
        expect(() => money.allocate({0: 0})).to.throw('No ratios defined');
      });

      it('should return zero if amount is zero', () => {
        const money = Money.valueOf({amount: '0.00', currency: 'EUR'});
        const allocations = money.allocate({0: 0});

        expect(allocations[0].amount.toString()).to.eq('0');
      });
    });

    describe('zero ratio with others', () => {
      const money = Money.valueOf({amount: '1.00', currency: 'EUR'});
      const allocations = money.allocate({0: 0, 1: 1, 2: 2});

      it('should return zero amount', () => {
        expect(allocations[0].amount.toString()).to.eq('0');
      });

      it('should not affect others', () => {
        expect(allocations[1].amount.toString()).to.eq('0.33');
        expect(allocations[2].amount.toString()).to.eq('0.67');
      });
    });
  });

  describe('convert', () => {
    const money1 = Money.valueOf({amount: '5.20', currency: 'EUR'});
    const money2 = money1.convertTo('USD', 1.120931);

    it('should have the new currency', () => {
      expect(money2.currency.code).to.eq('USD');
    });

    it('should be converted with the given rate', () => {
      expect(money2.amount.toString()).to.eq('5.83');
    });
  });

  describe('equals', () => {
    const money = Money.valueOf({amount: 12.3, currency: EUR});

    it('should return true if amount and currency equal', () => {
      expect(money.equals(Money.valueOf({amount: 12.3, currency: EUR}))).to.eq(true);
    });

    it('should return false if amount not equal', () => {
      expect(money.equals(Money.valueOf({amount: 5, currency: EUR}))).to.eq(false);
    });

    it('should return false if currency not equal', () => {
      expect(money.equals(Money.valueOf({amount: 12.3, currency: USD}))).to.eq(false);
    });

    it('should return false if value is undefined', () => {
      expect(money.equals(undefined)).to.eq(false);
    });

    it('should return false if value is null', () => {
      expect(money.equals(null)).to.eq(false);
    });
  });

  describe('toString', () => {
    const money = Money.valueOf({amount: 12.3, currency: EUR});

    it('should return a string representation', () => {
      expect(money.toString()).to.eq('12.30 EUR');
    });
  });

  describe('formatAmount', () => {
    it('should format the amount without currency symbol', () => {
      const value = new Money({amount: '10.14', currency: EUR});
      expect(value.formatAmount()).to.eq('10,14');
    });

    it('should use figure space as the default group separator', () => {
      const value = new Money({amount: '2310.14', currency: EUR});
      expect(value.formatAmount()).to.eq('2\xA0310,14');
    });

    it('should use the group separator also with larger values', () => {
      const value = new Money({amount: '4645231.00', currency: EUR});
      expect(value.formatAmount()).to.eq('4\xA0645\xA0231,00');
    });

    it('should separate groups with zero exponent', () => {
      const value = new Money({amount: 2310, currency: {code: 'XTS', exponent: 0}});
      expect(value.formatAmount()).to.eq('2\xA0310');
    });

    it('should format the minus sign', () => {
      const value = new Money({amount: '-1.00', currency: EUR});
      expect(value.formatAmount()).to.eq('\u22121,00');
    });

    it('should print all decimals', () => {
      const money = Money.valueOf({amount: 7, currency: EUR});
      expect(money.formatAmount()).to.eq('7,00');
    });

    it('should format rounded amount', () => {
      const money = Money.valueOf({amount: '1.1666666666666666667', currency: EUR});
      expect(money.formatAmount()).to.eq('1,17');
    });

    it('should format amount with large exponent', () => {
      const money = Money.valueOf({amount: 15, currency: {code: 'XTS', exponent: 8}});
      expect(money.formatAmount()).to.eq('15,00000000');
    });

    it('should format amount with zero exponent', () => {
      const money = Money.valueOf({amount: 120, currency: {code: 'XTS', exponent: 0}});
      expect(money.formatAmount()).to.eq('120');
    });

    it('should format the amount with custom decimal separator', () => {
      const value = new Money({amount: '10.14', currency: EUR});
      expect(value.formatAmount('.')).to.eq('10.14');
    });

    it('should use a custom group separator', () => {
      const value = new Money({amount: '2310.14', currency: EUR});
      expect(value.formatAmount(',', '.')).to.eq('2.310,14');
    });
  });
});
