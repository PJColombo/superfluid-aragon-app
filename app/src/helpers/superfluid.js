import BN from 'bn.js';
import { differenceInSeconds } from 'date-fns';
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

export const calculateCurrentAmount = (accumulatedAmount, rate, lastDate, date) => {
  return accumulatedAmount.add(rate.mul(new BN(differenceInSeconds(date ?? new Date(), lastDate))));
};

export const calculateDepletionDate = (balance, netFlow, currentDate, lastUpdateDate) => {
  if (!netFlow.isNeg()) {
    return;
  }

  const b = calculateCurrentAmount(balance, netFlow, lastUpdateDate, lastUpdateDate);
  const currentBalance = calculateCurrentAmount(balance, netFlow, lastUpdateDate, currentDate);
  const millisecondsToDepletion = Math.floor(
    currentBalance
      .div(netFlow.abs())
      .mul(new BN(1000))
      .toNumber()
  );
  const currentDateMilliseconds = currentDate.getTime();

  return new Date(currentDateMilliseconds + millisecondsToDepletion);
};
