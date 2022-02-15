import BN from 'bn.js';
import { differenceInSeconds } from 'date-fns';
import Web3EthAbi from 'web3-eth-abi';
import { addressesEqual, fromDecimals, isTestNetwork, MONTH, ZERO_ADDRESS, ZERO_BN } from '.';
import superTokenABI from '../abi/SuperToken';

const NATIVE_SUPER_TOKENS = {
  4: '0xa623b2DD931C5162b7a0B25852f4024Db48bb1A0', // ETHx
  100: '0x59988e47A3503AaFaA0368b9deF095c818Fdca01', // xDAIx
  137: '0x3aD736904E9e65189c3000c7DD2c8AC8bB7cD4e3', // Polygon,
  80001: '0x96B82B65ACF7072eFEb00502F45757F254c2a0D4', // Mumbai
};

export const isSuperToken = async (tokenAddress, app) => {
  try {
    const superToken = app.external(tokenAddress, superTokenABI);

    await superToken.getHost().toPromise();
    return true;
  } catch (err) {
    return false;
  }
};

export const isNativeSuperToken = (superTokenAddress, underlyingTokenAddress, chainId) =>
  addressesEqual(underlyingTokenAddress, ZERO_ADDRESS) ||
  addressesEqual(superTokenAddress, NATIVE_SUPER_TOKENS[chainId]);

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
  return accumulatedAmount.add(rate.mul(new BN(differenceInSeconds(date || new Date(), lastDate))));
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

export const getAvailableSuperTokens = superTokens =>
  superTokens
    // Filter out tokens with empty balances.
    .filter(({ balance, netFlow, lastUpdateDate }) =>
      calculateCurrentAmount(balance, netFlow, lastUpdateDate).gt(ZERO_BN)
    );

export const callAgreement = (host, cfaAddress, params, userData, operationABI) => {
  return host
    .callAgreement(
      cfaAddress,
      Web3EthAbi.encodeFunctionCall(operationABI, params),
      userData && userData.length ? userData : '0x'
    )
    .toPromise();
};
