import BN from 'bn.js';
import { differenceInSeconds } from 'date-fns';
import Web3EthAbi from 'web3-eth-abi';
import { fromDecimals, isTestNetwork, MONTH } from '.';
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

export const toMonthlyRate = flowRate => {
  let normalizedFlowRate;

  if (BN.isBN(flowRate)) {
    normalizedFlowRate = flowRate.toNumber();
  } else if (typeof flowRate === 'string') {
    normalizedFlowRate = Number(flowRate);
  } else if (typeof flowRate === 'number') {
    normalizedFlowRate = flowRate;
  } else {
    return;
  }

  return normalizedFlowRate * MONTH;
};

export const calculateCurrentAmount = (accumulatedAmount, rate, lastDate, date) => {
  return accumulatedAmount.add(rate.mul(new BN(differenceInSeconds(date ?? new Date(), lastDate))));
};

export const calculateDepletionDate = (balance, netFlow, currentDate, lastUpdateDate) => {
  if (!netFlow.isNeg()) {
    return;
  }

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

export const calculateRequiredDeposit = (flowRate, liquidationPeriod) => {
  if (!flowRate || isNaN(flowRate) || !liquidationPeriod || isNaN(liquidationPeriod)) {
    return;
  }

  let normalizedFlowRate, normalizedLiquidationPeriod;

  if (typeof flowRate === 'string') {
    normalizedFlowRate = Number(flowRate);
  } else {
    normalizedFlowRate = flowRate;
  }

  if (typeof liquidationPeriod === 'string') {
    normalizedLiquidationPeriod = Number(liquidationPeriod);
  } else {
    normalizedLiquidationPeriod = liquidationPeriod;
  }

  return normalizedFlowRate * normalizedLiquidationPeriod;
};

export const callAgreement = (host, cfaAddress, params, operationABI) => {
  return host
    .callAgreement(cfaAddress, Web3EthAbi.encodeFunctionCall(operationABI, params), '0x')
    .toPromise();
};
