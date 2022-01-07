import { fromDecimals, isTestNetwork } from '.';
import superTokenABI from '../abi/SuperToken';

export const isSuperToken = async (tokenAddress, app) => {
  try {
    const superToken = app.external(tokenAddress, superTokenABI);

    await superToken.getHost().toPromise();
    return true;
  } catch (err) {
    return false;
  }
};

export const getUnderlyingTokenSymbol = (superTokenSymbol, networkType) => {
  const isFakeSuperToken =
    isTestNetwork(networkType) && superTokenSymbol.charAt(0).toLowerCase() === 'f';

  return superTokenSymbol.slice(isFakeSuperToken ? 1 : 0, superTokenSymbol.length - 1);
};

export const calculateNewFlowRate = (existingFlow, flowRate) => {
  return existingFlow
    ? (Number(fromDecimals(existingFlow.flowRate)) + Number(flowRate)).toString()
    : flowRate;
};
