import { isAddress } from 'web3-utils';
import { addressesEqual, ZERO_ADDRESS } from '../helpers';
import erc20ABI from '../abi/ERC20.json';

const DEFAULT_NATIVE_CURRENCY_DECIMALS = 18;
const DEFAULT_NATIVE_CURRENCY_SYMBOL = 'ETH';

export const loadTokenData = (token, api, network) => {
  let tokenContract;

  if (isAddress(token)) {
    if (addressesEqual(token, ZERO_ADDRESS)) {
      const { decimals, symbol } = network && network.nativeCurrency ? network.nativeCurrency : {};
      return [
        decimals && decimals !== 0 ? decimals : DEFAULT_NATIVE_CURRENCY_DECIMALS,
        symbol || DEFAULT_NATIVE_CURRENCY_SYMBOL,
        symbol || DEFAULT_NATIVE_CURRENCY_SYMBOL,
      ];
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
