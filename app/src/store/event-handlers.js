import { addressesEqual } from '../helpers';
import { calculateNewAccumulatedAmount, getFlowEventEntity, isFlowEqual } from './helpers';
import erc20Abi from '../abi/ERC20.json';
import superTokenABI from '../abi/SuperToken.js';

const superTokenContracts = new Map();

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

  const [newSuperTokens, newFlows] = await Promise.all([
    updateSuperTokens(
      state,
      app,
      tokenAddress,
      timestamp,
      addressesEqual(agentAddress, sender) ? totalSenderFlowRate : totalReceiverFlowRate
    ),
    updateFlows(state, event, timestamp, settings.superfluid.cfa.contract),
  ]);

  return {
    ...state,
    superTokens: newSuperTokens,
    flows: newFlows,
  };
};

export const handleVaultEvent = async (state, event, app) => {
  const { token: tokenAddress, _blockNumber } = event.returnValues;
  const { timestamp } = await app.web3Eth('getBlock', _blockNumber).toPromise();

  return {
    ...state,
    superTokens: await updateSuperTokens(state, app, tokenAddress, timestamp),
  };
};

export const handleSetAgent = async (
  state,
  { returnValues: { agent: newAgentAddress } },
  settings
) => {
  console.log('Should unsubscribe from previous agent and subscribe to the new one');

  // TODO: Implement handler (cancel all old agent's subscriptions and subscribe to the new one)
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
  app,
  tokenAddress,
  updateTimestamp,
  netFlow
) => {
  const tokenContract = getSuperTokenContract(tokenAddress, app);
  const newSuperTokens = [...oldSuperTokens];
  let superTokenIndex = oldSuperTokens.findIndex(({ address }) =>
    addressesEqual(tokenAddress, address)
  );
  let updatedToken;

  if (superTokenIndex === -1) {
    updatedToken = {
      ...(await newSuperToken(tokenContract, app)),
    };
  } else {
    updatedToken = {
      ...oldSuperTokens[superTokenIndex],
    };
  }

  updatedToken.address = tokenAddress;
  updatedToken.lastUpdateTimestamp = updateTimestamp;
  updatedToken.balance = await tokenContract.balanceOf(agentAddress).toPromise();

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

const updateFlows = async (state, event, updateTimestamp) => {
  const { agentAddress } = state;
  const { receiver, flowRate, token: tokenAddress } = event.returnValues;
  const newFlows = [...state.flows];

  const isIncoming = addressesEqual(receiver, agentAddress);
  const flowIndex = newFlows.findIndex(flow => isFlowEqual(flow, event));
  const flowExists = !!newFlows[flowIndex];

  // Create flow case
  if (!flowExists) {
    newFlows.push({
      isIncoming,
      entity: getFlowEventEntity(event, isIncoming),
      superTokenAddress: tokenAddress,
      accumulatedAmount: '0',
      creationTimestamp: updateTimestamp,
      lastTimestamp: updateTimestamp,
      flowRate,
    });
  }
  // Update flow case
  else if (flowExists && flowRate > 0) {
    newFlows[flowIndex] = {
      ...newFlows[flowIndex],
      accumulatedAmount: calculateNewAccumulatedAmount(state.flows[flowIndex], updateTimestamp),
      lastTimestamp: updateTimestamp,
      flowRate,
    };
  }
  // Delete flow case
  else {
    delete newFlows[flowIndex];
  }

  return newFlows;
};

const newSuperToken = async (tokenContract, app) => {
  const [name, decimals, symbol, underlyingTokenAddress] = await Promise.all([
    tokenContract.name().toPromise(),
    tokenContract.decimals().toPromise(),
    tokenContract.symbol().toPromise(),
    tokenContract.getUnderlyingToken().toPromise(),
  ]);

  const underlyingTokenContract = app.external(underlyingTokenAddress, erc20Abi);
  const [underlyingName, underlyingDecimals, underlyingSymbol] = await Promise.all([
    underlyingTokenContract.name().toPromise(),
    underlyingTokenContract.decimals().toPromise(),
    underlyingTokenContract.symbol().toPromise(),
  ]);

  return {
    decimals,
    name,
    symbol,
    underlyingToken: {
      address: underlyingTokenAddress,
      name: underlyingName,
      decimals: underlyingDecimals,
      symbol: underlyingSymbol,
    },
    netFlow: 0,
    balance: 0,
  };
};
