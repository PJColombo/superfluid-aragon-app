import { addressesEqual } from '../helpers/web3-helpers';
import superTokenABI from '../abi/SuperToken.json';

const superTokenContracts = new Map();

export const handleFlowUpdated = async (state, event, app, { superfluid: { cfa } }) => {
  const agentAddress = state.agentAddress;

  if (!isAgentInFlow(agentAddress, event)) {
    return state;
  }

  const { token: tokenAddress, sender, receiver } = event.returnValues;

  const tokenContract = getSuperTokenContract(tokenAddress, app);

  let tokenEntry;

  if (state.superTokens[tokenAddress]) {
    tokenEntry = state.superTokens[tokenAddress];
  } else {
    tokenEntry = await newSuperTokenEntry(tokenContract);
  }

  const flowsType = addressesEqual(sender, agentAddress) ? 'outFlows' : 'inFlows';
  const flowData = await cfa.contract.getFlow(tokenAddress, sender, receiver).toPromise();

  const updatedTokenEntryFlow = updateTokenEntryFlow(
    tokenEntry[flowsType],
    event,
    flowsType,
    flowData
  );

  return {
    ...state,
    superTokens: {
      ...state.superTokens,
      [tokenAddress]: {
        ...tokenEntry,
        balance: await tokenContract.balanceOf(agentAddress).toPromise(),
        ...updatedTokenEntryFlow,
      },
    },
  };
};

export const handleVaultEvent = async (state, { returnValues }, app) => {
  const agentAddress = state.agentAddress;
  const { token: tokenAddress } = returnValues;
  const tokenContract = getSuperTokenContract(tokenAddress, app);

  let tokenEntry = state.superTokens[tokenAddress]
    ? state.superTokens[tokenAddress]
    : await newSuperTokenEntry(tokenContract);

  return {
    ...state,
    superTokens: {
      ...state.superTokens,
      [tokenAddress]: {
        ...tokenEntry,
        balance: await tokenContract.balanceOf(agentAddress).toPromise(),
      },
    },
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

const isAgentInFlow = (agentAddress, { returnValues: { sender, receiver } }) => {
  return addressesEqual(agentAddress, sender) || addressesEqual(agentAddress, receiver);
};

const getSuperTokenContract = (tokenAddress, app) => {
  const tokenContract = superTokenContracts.has(tokenAddress)
    ? superTokenContracts.get(tokenAddress)
    : app.external(tokenAddress, superTokenABI);
  superTokenContracts.set(tokenAddress, tokenContract);

  return tokenContract;
};

const newSuperTokenEntry = async tokenContract => {
  const [name, decimals, symbol, underlyingToken] = await Promise.all([
    tokenContract.name().toPromise(),
    tokenContract.decimals().toPromise(),
    tokenContract.symbol().toPromise(),
    tokenContract.getUnderlyingToken().toPromise(),
  ]);

  return {
    metadata: {
      name,
      decimals,
      symbol,
      underlyingToken,
    },
    balance: 0,
    netFlow: 0,
    inFlows: {},
    outFlows: {},
  };
};

const updateTokenEntryFlow = (flowsEntry, event, flowsType, { timestamp } = {}) => {
  const {
    sender,
    receiver,
    flowRate,
    totalSenderFlowRate,
    totalReceiverFlowRate,
  } = event.returnValues;
  const flowEntity = [flowsType === 'outFlows' ? receiver : sender];
  const updatedFlowEntityEntry = { flowRate, timestamp };

  let updatedFlows;
  // Create flow case
  if (!flowsEntry[flowEntity]) {
    updatedFlows = {
      ...flowsEntry,
      [flowEntity]: updatedFlowEntityEntry,
    };
  }
  // Update flow case
  else if (flowsEntry[flowEntity] && flowRate > 0) {
    updatedFlows = {
      ...flowsEntry,
      [flowEntity]: updatedFlowEntityEntry,
    };
  }
  // Delete flow case
  else {
    updatedFlows = {
      ...flowsEntry,
    };
    delete updatedFlows[flowEntity];
  }

  return {
    netFlow: flowsType === 'outFlows' ? totalSenderFlowRate : totalReceiverFlowRate,
    [flowsType]: updatedFlows,
  };
};
