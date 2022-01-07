import { BN } from 'bn.js';
/**
 * Get the whole and decimal parts from a number.
 * Trims leading and trailing zeroes.
 *
 * @param {string} num the number
 * @returns {Array<string>} array with the [<whole>, <decimal>] parts of the number
 */
function splitDecimalNumber(num) {
  const [whole = '', dec = ''] = num.split('.');
  return [
    whole.replace(/^0*/, ''), // trim leading zeroes
    dec.replace(/0*$/, ''), // trim trailing zeroes
  ];
}

/**
 * Format a decimal-based number back to a normal number
 *
 * @param {string | BN | Number} num the number
 * @param {number | string} decimals number of decimal places
 * @param {Object} [options] options object
 * @param {bool} [options.truncate=true] Should the number be truncated to its decimal base
 * @returns {string} formatted number
 */
export function fromDecimals(num, decimals = 18, { truncate = true } = {}) {
  let normalizedDecimals;
  let normalizedNum = '';

  if (BN.isBN(num)) {
    normalizedNum = num.toString();
  } else if (typeof num === 'number') {
    normalizedNum = num.toString();
  } else {
    normalizedNum = num;
  }

  if (typeof decimals === 'string') {
    normalizedDecimals = parseInt(decimals);
  } else {
    normalizedDecimals = decimals;
  }

  const [whole, dec] = splitDecimalNumber(normalizedNum);
  if (!whole && !dec) {
    return '0';
  }

  const paddedWhole = whole.padStart(normalizedDecimals + 1, '0');
  const decimalIndex = paddedWhole.length - normalizedDecimals;
  const wholeWithoutBase = paddedWhole.slice(0, decimalIndex);
  const decWithoutBase = paddedWhole.slice(decimalIndex);

  if (!truncate && dec) {
    // We need to keep all the zeroes in this case
    return `${wholeWithoutBase}.${decWithoutBase}${dec}`;
  }

  // Trim any trailing zeroes from the new decimals
  const decWithoutBaseTrimmed = decWithoutBase.replace(/0*$/, '');
  if (decWithoutBaseTrimmed) {
    return `${wholeWithoutBase}.${decWithoutBaseTrimmed}`;
  }

  return wholeWithoutBase;
}

/**
 * Format the number to be in a given decimal base
 *
 * @param {string | BN | Number} num the number
 * @param {number | string} decimals number of decimal places
 * @param {Object} [options] options object
 * @param {bool} [options.truncate=true] Should the number be truncated to its decimal base
 * @returns {string} formatted number
 */
export function toDecimals(num, decimals = 18, { truncate = true } = {}) {
  let normalizedDecimals;
  let normalizedNum = '';

  if (BN.isBN(num)) {
    normalizedNum = num.toString();
  } else if (typeof num === 'number') {
    normalizedNum = num.toString();
  } else {
    normalizedNum = num;
  }

  if (typeof decimals === 'string') {
    normalizedDecimals = parseInt(decimals);
  } else {
    normalizedDecimals = decimals;
  }

  const [whole, dec] = splitDecimalNumber(normalizedNum);
  if (!whole && (!dec || !normalizedDecimals)) {
    return '0';
  }

  const wholeLengthWithBase = whole.length + normalizedDecimals;
  const withoutDecimals = (whole + dec).padEnd(wholeLengthWithBase, '0');
  const wholeWithBase = withoutDecimals.slice(0, wholeLengthWithBase);

  if (!truncate && wholeWithBase.length < withoutDecimals.length) {
    return `${wholeWithBase}.${withoutDecimals.slice(wholeLengthWithBase)}`;
  }
  return wholeWithBase;
}
