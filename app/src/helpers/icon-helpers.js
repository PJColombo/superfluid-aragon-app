import { tokenIconUrl as _tokenIconUrl } from '@aragon/ui';
import { getUnderlyingTokenSymbol } from '.';
import { ETHER_TOKEN_VERIFIED_BY_SYMBOL } from './verified-tokens';

// Small shim on top of @aragon/ui's tokenIconUrl, to handle our testnet tokens
export const superTokenIconUrl = (tokenAddress, tokenSymbol, networkType) => {
  const underlyingTokenSymbol = getUnderlyingTokenSymbol(tokenSymbol, networkType);
  if (networkType === 'main') {
    return _tokenIconUrl(tokenAddress);
  }

  // On other networks, only pretend known test tokens are legit
  const mainnetEquivalent = ETHER_TOKEN_VERIFIED_BY_SYMBOL.get(underlyingTokenSymbol);
  return mainnetEquivalent ? _tokenIconUrl(mainnetEquivalent) : '';
};
