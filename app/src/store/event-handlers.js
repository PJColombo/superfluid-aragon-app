import { addressesEqual } from '../helpers/web3-helpers';
import { calculateFlowAmount, isFlowEqual } from './helpers';
import superTokenABI from '../abi/SuperToken.json';

const superTokenContracts = new Map();

export const handleFlowUpdated = async (state, event, app, settings) => {
  const { agentAddress } = state;
  const {
    sender,
    receiver,
    token: tokenAddress,
    totalReceiverFlowRate,
    totalSenderFlowRate,
  } = event.returnValues;

  if (!isAgentSender(agentAddress, sender, receiver)) {
    return state;
  }

  const tokenContract = getSuperTokenContract(tokenAddress, app);
  const flowsType = addressesEqual(sender, agentAddress) ? 'outFlows' : 'inFlows';

  const [newSuperTokens, newFlows] = await Promise.all([
    updateSuperTokens(
      state,
      tokenAddress,
      tokenContract,
      addressesEqual(agentAddress, sender) ? totalSenderFlowRate : totalReceiverFlowRate
    ),
    updateFlows(state, event, flowsType, settings.superfluid.cfa.contract),
  ]);

  return {
    ...state,
    superTokens: newSuperTokens,
    [flowsType]: newFlows,
  };
};

export const handleVaultEvent = async (state, event, app) => {
  const { token: tokenAddress } = event.returnValues;
  const tokenContract = getSuperTokenContract(tokenAddress, app);

  return {
    ...state,
    superTokens: await updateSuperTokens(state, tokenAddress, tokenContract),
  };
};

export const handleSetAgent = async (
  state,
  { returnValues: { agent: newAgentAddress } },
  settings
) => {
  console.log('Should unsubscribe from previous agent and subscribe to the new one');

  // Cancel all old agent's subscriptions

  // Subscribe to new agent
};

const isAgentSender = (agentAddress, sender, receiver) => {
  return addressesEqual(agentAddress, sender) || addressesEqual(agentAddress, receiver);
};

const getSuperTokenContract = (tokenAddress, app) => {
  const tokenContract = superTokenContracts.has(tokenAddress)
    ? superTokenContracts.get(tokenAddress)
    : app.external(tokenAddress, superTokenABI);
  superTokenContracts.set(tokenAddress, tokenContract);

  return tokenContract;
};

const updateSuperTokens = async (
  { superTokens: oldSuperTokens, agentAddress },
  tokenAddress,
  tokenContract,
  { netFlow } = {}
) => {
  const newSuperTokens = [...oldSuperTokens];
  let superTokenIndex = oldSuperTokens.findIndex(({ address }) =>
    addressesEqual(tokenAddress, address)
  );
  const updatedToken = {
    ...(superTokenIndex === -1
      ? await newSuperToken(tokenContract)
      : oldSuperTokens[superTokenIndex]),
    address: tokenAddress,
    balance: await tokenContract.balanceOf(agentAddress).toPromise(),
  };

  if (typeof netFlow !== 'undefined') {
    updatedToken.netFlow = netFlow;
  }

  if (superTokenIndex === -1) {
    newSuperTokens.push(updatedToken);
  } else {
    newSuperTokens[superTokenIndex] = updatedToken;
  }

  return newSuperTokens;
};

const updateFlows = async (state, event, flowsType, cfaContract) => {
  const { sender, receiver, flowRate, token: tokenAddress } = event.returnValues;
  const newFlows = [...state[flowsType]];

  const { timestamp } = await cfaContract.getFlow(tokenAddress, sender, receiver).toPromise();
  const flowIndex = state[flowsType].findIndex(flow => isFlowEqual(flow, event, flowsType));
  const flowEntity = flowsType === 'outFlows' ? { receiver } : { sender };
  const flowExists = !!newFlows[flowIndex];

  // Create flow case
  if (!flowExists) {
    newFlows[0] = {
      ...flowEntity,
      superTokenAddress: tokenAddress,
      accumulatedAmount: 0,
      creationTimestamp: timestamp,
      lastTimestamp: timestamp,
      flowRate,
    };
  }
  // Update flow case
  else if (flowExists && flowRate > 0) {
    newFlows[flowIndex] = {
      ...newFlows[flowIndex],
      accumulatedAmount: calculateFlowAmount(
        timestamp,
        newFlows[flowIndex].creationTimestamp,
        flowRate
      ),
      lastTimestamp: timestamp,
      flowRate,
    };
  }
  // Delete flow case
  else {
    delete newFlows[flowEntity];
  }

  return newFlows;
};

const newSuperToken = async tokenContract => {
  const [name, decimals, symbol, underlyingToken] = await Promise.all([
    tokenContract.name().toPromise(),
    tokenContract.decimals().toPromise(),
    tokenContract.symbol().toPromise(),
    tokenContract.getUnderlyingToken().toPromise(),
  ]);

  return {
    decimals,
    name,
    symbol,
    underlyingToken,
    netFlow: 0,
    balance: 0,
  };
};
