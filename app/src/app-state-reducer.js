import { BN } from 'bn.js';
import { timestampToDate } from './helpers';

const appStateReducer = state => {
  if (state === null) {
    return { isSyncing: true };
  }

  console.log({
    ...state,
    superTokens: state.superTokens.map(superToken => ({
      ...superToken,
      balance: new BN(superToken.balance),
      lastUpdateDate: timestampToDate(superToken.lastUpdateTimestamp),
      netFlow: new BN(superToken.netFlow),
    })),
    flows: state.flows.map(flow => ({
      ...flow,
      accumulatedAmount: new BN(flow.accumulatedAmount),
      creationDate: timestampToDate(flow.creationTimestamp),
      flowRate: new BN(flow.flowRate),
      lastUpdateDate: timestampToDate(flow.lastTimestamp),
    })),
  });

  return {
    ...state,
    superTokens: state.superTokens.map(superToken => ({
      ...superToken,
      balance: new BN(superToken.balance),
      lastUpdateDate: timestampToDate(superToken.lastUpdateTimestamp),
      netFlow: new BN(superToken.netFlow),
    })),
    flows: state.flows.map(flow => ({
      ...flow,
      accumulatedAmount: new BN(flow.accumulatedAmount),
      creationDate: timestampToDate(flow.creationTimestamp),
      flowRate: new BN(flow.flowRate),
      lastUpdateDate: timestampToDate(flow.lastTimestamp),
    })),
  };
};

export default appStateReducer;
