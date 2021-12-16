import { BN } from 'bn.js';

const processFlows = flows =>
  flows.map(flow => ({
    ...flow,
    accumulatedAmount: new BN(flow.accumulatedAmount),
    creationTimestamp: new Date(flow.creationTimestamp),
    flowRate: new BN(flow.flowRate),
    lastTimestamp: new Date(flow.lastTimestamp),
  }));

const appStateReducer = state => {
  if (state === null) {
    return { isSyncing: true };
  }

  return {
    ...state,
    superTokens: state.superTokens.map(superToken => ({
      ...superToken,
      balance: new BN(superToken.balance),
      netFlow: new BN(superToken.netFlow),
    })),
    inFlows: processFlows(state.inFlows),
    outFlows: processFlows(state.outFlows),
  };
};

export default appStateReducer;
