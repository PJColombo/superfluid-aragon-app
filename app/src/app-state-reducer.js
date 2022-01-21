import { BN } from 'bn.js';
import { calculateDepletionDate, timestampToDate } from './helpers';

const INITIAL_STATE = {
  agentAddress: '',
  flows: [],
  superTokens: [],
  sendersSuperTokens: {},
  isSyncing: true,
};

const compareSuperTokensBySymbol = (tokenA, tokenB) => {
  return tokenA.symbol.localeCompare(tokenB.symbol);
};

const calculateInOutRate = (inOutRates, superTokenAddress, flowRate, flowIncoming) => {
  const inOutRate = inOutRates[superTokenAddress] || [new BN(0), new BN(0)];
  const index = flowIncoming ? 0 : 1;
  inOutRate[index] = inOutRate[index].add(flowRate);
  return inOutRate;
};

const appStateReducer = state => {
  if (state === null) {
    return { ...INITIAL_STATE };
  }
  const now = new Date();
  const inOutRates = {};

  const formattedFlows = state.flows.map(
    ({
      accumulatedAmount,
      creationDate,
      creationTimestamp,
      flowRate,
      lastUpdateDate,
      lastTimestamp,
      ...flow
    }) => {
      const flowRateBN = new BN(flowRate);

      if (!flow.isCancelled) {
        const updatedInOutRate = calculateInOutRate(
          inOutRates,
          flow.superTokenAddress,
          flowRateBN,
          flow.isIncoming
        );
        inOutRates[flow.superTokenAddress] = updatedInOutRate;
      }

      return {
        ...flow,
        accumulatedAmount: new BN(accumulatedAmount),
        creationDate: timestampToDate(creationTimestamp),
        flowRate: flowRateBN,
        lastUpdateDate: timestampToDate(lastTimestamp),
      };
    }
  );
  const formattedSuperTokens = state.superTokens.map(
    ({
      underlyingToken,
      balance,
      lastUpdateDate,
      lastUpdateTimestamp,
      liquidationPeriodSeconds,
      netFlow,
      decimals,
      ...superToken
    }) => {
      const formattedBalance = new BN(balance);
      const formattedNetflow = new BN(netFlow);
      const formattedLastUpdateDate = timestampToDate(lastUpdateTimestamp);
      const [inflowRate, outflowRate] = inOutRates[superToken.address] ?? [new BN(0), new BN(0)];

      return {
        ...superToken,
        underlyingToken: {
          ...underlyingToken,
          decimals: parseInt(underlyingToken.decimals),
        },
        balance: formattedBalance,
        lastUpdateDate: formattedLastUpdateDate,
        liquidationPeriodSeconds: parseInt(liquidationPeriodSeconds),
        inflowRate,
        outflowRate,
        netFlow: formattedNetflow,
        decimals: parseInt(decimals),
        depletionDate: calculateDepletionDate(
          formattedBalance,
          formattedNetflow,
          now,
          formattedLastUpdateDate
        ),
      };
    }
  );
  const formattedSendersSuperTokens = Object.keys(state.sendersSuperTokens).reduce(
    (newSendersSuperTokens, sender) => {
      newSendersSuperTokens[sender] = state.sendersSuperTokens[sender].map(superToken => ({
        ...superToken,
        balance: new BN(superToken.balance),
        lastUpdateDate: timestampToDate(superToken.lastUpdateTimestamp),
        netFlow: new BN(superToken.netFlow),
      }));

      return newSendersSuperTokens;
    },
    {}
  );

  return {
    ...state,
    superTokens: formattedSuperTokens.sort(compareSuperTokensBySymbol),
    flows: formattedFlows,
    sendersSuperTokens: formattedSendersSuperTokens,
  };
};
export default appStateReducer;
