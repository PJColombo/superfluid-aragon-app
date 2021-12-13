import { BN } from 'bn.js';

const processFlows = (flows, isOutFlow) =>
  Object.keys(flows).map(key => {
    const flowEntry = flows[key];

    return {
      [isOutFlow ? 'receiver' : 'sender']: key,
      ...flowEntry,
      flowRate: new BN(flowEntry.flowRate),
    };
  });

const appStateReducer = state => {
  if (state === null) {
    return { isSyncing: true };
  }

  return {
    ...state,
    superTokens: Object.keys(state.superTokens).map(key => {
      const superToken = state.superTokens[key];

      return {
        ...superToken,
        address: key,
        balance: new BN(superToken.balance),
        inFlows: processFlows(superToken.inFlows, false),
        outFlows: processFlows(superToken.outFlows, true),
      };
    }),
  };
};

export default appStateReducer;
