import { isAddress } from 'web3-utils';
import { addressesEqual, ZERO_ADDRESS } from '../helpers';
import erc20ABI from '../abi/ERC20.json';

const ETHEREUM_NATIVE_CURRENCY = { decimals: 18, name: 'ETH', symbol: 'ETH' };
const XDAI_NATIVE_CURRENCY = { decimals: 18, name: 'xDAI', symbol: 'XDAI' };
const POLYGON_NATIVE_CURRENCY = { decimals: 18, name: 'MATIC', symbol: 'MATIC' };

const NATIVE_CURRENCIES = {
  1: ETHEREUM_NATIVE_CURRENCY,
  4: ETHEREUM_NATIVE_CURRENCY,
  100: XDAI_NATIVE_CURRENCY,
  137: POLYGON_NATIVE_CURRENCY,
  80001: POLYGON_NATIVE_CURRENCY,
};

export const loadTokenData = (token, api, network) => {
  let tokenContract;

  if (isAddress(token)) {
    if (addressesEqual(token, ZERO_ADDRESS)) {
      const { decimals, name, symbol } = network && network.id ? NATIVE_CURRENCIES[network.id] : {};
      return [decimals, name, symbol];
    }
    tokenContract = api.external(token, erc20ABI);
  } else {
    tokenContract = token;
  }

  return Promise.all([
    tokenContract.decimals().toPromise(),
    tokenContract.name().toPromise(),
    tokenContract.symbol().toPromise(),
  ]);
};

export const loadTokenHolderBalance = (tokenAddress, holder, api) => {
  if (addressesEqual(tokenAddress, ZERO_ADDRESS)) {
    return api.web3Eth('getBalance', holder).toPromise();
  }

  const token = api.external(tokenAddress, erc20ABI);

  return token.balanceOf(holder).toPromise();
};

export const getFakeTokenSymbol = symbol =>
  symbol && symbol.charAt(0) === 'f' ? symbol.slice(1, symbol.length) : symbol;

export const getNativeCurrencyLogo = symbol => {
  switch (symbol.toUpperCase()) {
    case 'ETH':
      return 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png';
    case 'XDAI':
      return 'https://assets.coingecko.com/coins/images/11062/small/Identity-Primary-DarkBG.png?1638372986';
    case 'MATIC':
      return 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png';
  }
};
