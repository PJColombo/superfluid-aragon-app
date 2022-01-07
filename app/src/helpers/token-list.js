import { isTestNetwork } from '.';

const MAINNET_TOKEN_LIST = 'https://tokens.coingecko.com/uniswap/all.json';
const XDAI_TOKEN_LIST = 'https://tokens.honeyswap.org/';

export const getTokenListUrlByNetwork = network => {
  // Use mainnet token list for fetching token data such as logos
  if (isTestNetwork(network)) {
    return MAINNET_TOKEN_LIST;
  }

  switch (network.id) {
    case 1:
      return MAINNET_TOKEN_LIST;
    case 100:
      return XDAI_TOKEN_LIST;
    default:
      return null;
  }
};
