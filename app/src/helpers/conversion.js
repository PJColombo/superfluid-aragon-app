import BN from 'bn.js';

const BASE_URL = 'https://api.coingecko.com/api/v3/simple/token_price';

const USD = 'usd';
const USD_SYMBOL = '$';

export const DEFAULT_CURRENCY = USD;
export const DEFAULT_CURRENCY_SYMBOL = USD_SYMBOL;

const networkToAssetPlatform = networkName => {
  switch (networkName) {
    case 'private':
    case 'rinkeby':
    case 'mainnet':
      return 'ethereum';
    case 'xdai':
      return 'xdai';
    case 'polygon':
    case 'mumbai':
      return 'polygon-pos';
    default:
      return null;
  }
};

export const getConvertRatesUrl = (tokenAddresses, currencies, networkName) => {
  const assetPlatform = networkToAssetPlatform(networkName);
  return `${BASE_URL}/${assetPlatform}?vs_currencies=${currencies}&contract_addresses=${tokenAddresses}`;
};

export const getConvertRateToken = (superToken, isTestNetwork) =>
  isTestNetwork ? superToken.mainnetTokenEquivalentAddress : superToken.address;

export const getConvertedAmount = (amount, convertRate) => {
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
};
