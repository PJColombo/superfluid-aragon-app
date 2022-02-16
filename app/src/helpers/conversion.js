import BN from 'bn.js';
import { addressesEqual, LOCAL_NETWORK_ID, ZERO_ADDRESS } from '.';

const BASE_URL = 'https://api.coingecko.com/api/v3/simple/token_price';

const USD = 'usd';
const USD_SYMBOL = '$';

export const DEFAULT_CURRENCY = USD;
export const DEFAULT_CURRENCY_SYMBOL = USD_SYMBOL;

export const getNativeCurrencyContractEquivalent = symbol => {
  switch (symbol.toUpperCase()) {
    case 'ETH':
      // wETH on mainnet.
      return '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
    case 'XDAI':
      // wxDAI on xDAI network.
      return '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d';
    case 'MATIC':
      // Matic on Polygon PoS
      return '0x0000000000000000000000000000000000001010';
  }
};

const chainIdToAssetPlatform = chainId => {
  switch (chainId) {
    case 1:
    case 4:
    case LOCAL_NETWORK_ID:
      return 'ethereum';
    case 100:
      return 'xdai';
    case 137:
    case 80001:
      return 'polygon-pos';
    default:
      return null;
  }
};

export const getConvertRatesUrl = (tokenAddresses, currencies, chainId) => {
  const assetPlatform = chainIdToAssetPlatform(chainId);
  return `${BASE_URL}/${assetPlatform}?vs_currencies=${currencies}&contract_addresses=${tokenAddresses}`;
};

export const getConvertRateToken = (superToken, isTestNetwork) => {
  if (addressesEqual(superToken.underlyingToken.address, ZERO_ADDRESS)) {
    return getNativeCurrencyContractEquivalent(superToken.underlyingToken.symbol);
  }

  const convertRateToken = isTestNetwork
    ? superToken.mainnetTokenEquivalentAddress
    : superToken.underlyingToken.address;

  return convertRateToken ? convertRateToken.toLowerCase() : undefined;
};

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
