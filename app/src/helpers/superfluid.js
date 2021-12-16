import { isTestNetwork } from '.';

export const getUnderlyingTokenSymbol = (superTokenSymbol, networkType) => {
  const isFakeSuperToken =
    isTestNetwork(networkType) && superTokenSymbol.charAt(0).toLowerCase() === 'f';

  return superTokenSymbol.slice(isFakeSuperToken ? 1 : 0, superTokenSymbol.length - 1);
};
