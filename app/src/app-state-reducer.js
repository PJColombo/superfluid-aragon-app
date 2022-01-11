import { BN } from 'bn.js';
import { calculateDepletionDate, timestampToDate } from './helpers';

const INITIAL_STATE = {
  agentAddress: '',
  flows: [],
  superTokens: [],
  isSyncing: true,
};

const appStateReducer = state => {
  if (state === null) {
    return { ...INITIAL_STATE };
  }

  const now = new Date();

  return {
    ...state,
    superTokens: state.superTokens.map(
      ({
        underlyingToken,
        balance,
        lastUpdateDate,
        lastUpdateTimestamp,
        netFlow,
        decimals,
        ...superToken
      }) => {
        const formattedBalance = new BN(balance);
        const formattedNetflow = new BN(netFlow);
        const formattedLastUpdateDate = timestampToDate(lastUpdateTimestamp);

        return {
          ...superToken,
          underlyingToken: {
            ...underlyingToken,
            decimals: parseInt(underlyingToken.decimals),
          },
          balance: formattedBalance,
          lastUpdateDate: formattedLastUpdateDate,
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
    ),
    flows: state.flows.map(
      ({
        accumulatedAmount,
        creationDate,
        creationTimestamp,
        flowRate,
        lastUpdateDate,
        lastTimestamp,
        ...flow
      }) => ({
        ...flow,
        accumulatedAmount: new BN(accumulatedAmount),
        creationDate: timestampToDate(creationTimestamp),
        flowRate: new BN(flowRate),
        lastUpdateDate: timestampToDate(lastTimestamp),
      })
    ),
  };
};
export default appStateReducer;
