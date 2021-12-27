import { BN } from 'bn.js';
import { timestampToDate } from './helpers';

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

  return {
    ...state,
    superTokens: state.superTokens.map(superToken => ({
      ...superToken,
      underlyingToken: {
        ...superToken.underlyingToken,
        decimals: parseInt(superToken.underlyingToken.decimals),
      },
      balance: new BN(superToken.balance),
      lastUpdateDate: timestampToDate(superToken.lastUpdateTimestamp),
      netFlow: new BN(superToken.netFlow),
      decimals: parseInt(superToken.decimals),
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
