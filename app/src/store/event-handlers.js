import { addressesEqual } from '../helpers';
import { updateFlows, updateSendersSuperTokens, updateSuperTokens } from './updaters';

export const handleFlowUpdated = async (state, event, app, settings) => {
  const { agentAddress } = state;
  const {
    _blockNumber,
    sender,
    receiver,
    token: tokenAddress,
    totalReceiverFlowRate,
    totalSenderFlowRate,
  } = event.returnValues;

  if (!isAgentSender(agentAddress, sender, receiver)) {
    return state;
  }

  const { timestamp } = await app.web3Eth('getBlock', _blockNumber).toPromise();

  const [newSuperTokens, newSendersSuperTokens] = await Promise.all([
    await updateSuperTokens(
      state,
      app,
      settings,
      tokenAddress,
      timestamp,
      addressesEqual(agentAddress, sender) ? totalSenderFlowRate : totalReceiverFlowRate
    ),
    await updateSendersSuperTokens(state, event, timestamp),
  ]);

  return {
    ...state,
    superTokens: newSuperTokens,
    flows: updateFlows(state, event, timestamp, settings.superfluid.cfa.contract),
    sendersSuperTokens: newSendersSuperTokens,
  };
};

export const handleVaultEvent = async (state, event, app, settings) => {
  const { token: tokenAddress, _blockNumber } = event.returnValues;
  const { timestamp } = await app.web3Eth('getBlock', _blockNumber).toPromise();

  return {
    ...state,
    superTokens: await updateSuperTokens(state, app, settings, tokenAddress, timestamp),
  };
};

const isAgentSender = (agentAddress, sender, receiver) => {
  return addressesEqual(agentAddress, sender) || addressesEqual(agentAddress, receiver);
};
