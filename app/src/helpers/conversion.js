import BN from 'bn.js';

export const USD = 'usd';

export function getConvertedAmount(amount, convertRate) {
  const [whole = '', dec = ''] = convertRate.toString().split('.');
  // Remove any trailing zeros from the decimal part
  const parsedDec = dec.replace(/0*$/, '');
  // Construct the final rate, and remove any leading zeros
  const rate = `${whole}${parsedDec}`.replace(/^0*/, '');

  // Number of decimals to shift the amount of the token passed in,
  // resulting from converting the rate to a number without any decimal
  // places
  const carryAmount = new BN(parsedDec.length.toString());
  const expCarryAmount = new BN('10').pow(carryAmount);
  const oneDecimal = new BN('10').pow(new BN('18'));

  return amount.mul(new BN(rate).mul(oneDecimal)).div(oneDecimal.mul(expCarryAmount));
}
