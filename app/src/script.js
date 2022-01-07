import Aragon, { events } from '@aragon/api';
import agentABI from './abi/Agent.json';

import 'regenerator-runtime/runtime';
import {
  createSettings,
  EXTERNAL_SUBSCRIPTIONS_SYNCED,
  EXTERNAL_SUBSCRIPTION_CACHED,
  retryEvery,
  subscribeToExternals,
} from './store/helpers';
import { handleFlowUpdated, handleSetAgent, handleVaultEvent } from './store/event-handlers';
import { sha3 } from 'web3-utils';
import AbiCoder from 'web3-eth-abi';

const FLOW_UPDATED_SIGNATURE = 'FlowUpdated(address,address,address,int96,int256,int256,bytes)';

const app = new Aragon();

const getExternal = (address, abi) => {
  return {
    address,
    contract: app.external(address, abi),
  };
};

// Get the agent address to initialize ourselves
retryEvery(() =>
  app
    .call('agent')
    .toPromise()
    .then(agentAddress => initialize(agentAddress))
    .catch(err => {
      console.error(
        'Could not start background script execution due to the contract not loading the agent:',
        err
      );
      throw err;
    })
);

const initialize = async agentAddress => {
  const settings = await createSettings(app);

  return app.store(
    async (state, event) => {
      const { event: eventName } = event;
      console.log('Reciving event: ', eventName, ' at block ', event.returnValues._blockNumber);

      try {
        // Superfluid events
        if (eventName === 'FlowUpdated') {
          return handleFlowUpdated(state, event, app, settings);
        }

        // Agent events
        if (eventName === 'VaultTransfer' || eventName === 'VaultDeposit') {
          return handleVaultEvent(state, event, app, settings);
        }

        // App events
        switch (eventName) {
          case events.SYNC_STATUS_SYNCING:
            return { ...state, isSyncing: true };
          // Custom external subscriptions events
          case EXTERNAL_SUBSCRIPTION_CACHED:
            const { _address: externalAddress, blockNumber } = event.returnValues;
            return {
              ...state,
              blockNumbersCache: {
                ...state.blockNumbersCache,
                [externalAddress]: blockNumber,
              },
            };
          case EXTERNAL_SUBSCRIPTIONS_SYNCED:
            return { ...state, isSyncing: false };
          // Flow Finance events
          case 'SetAgent':
            return handleSetAgent(state, event);
          default:
            return state;
        }
      } catch (err) {
        console.log(err);
      }
    },
    {
      init: initializeState(agentAddress, settings),
    }
  );
};

const initializeState = (agentAddress, settings) => async cachedState => {
  console.log('Cached State:');
  console.log(cachedState);

  const {
    superfluid: { cfa },
  } = settings;
  const initialBlock =
    cachedState && cachedState.initialBlock
      ? cachedState.initialBlock
      : await getInitialBlock(agentAddress);
  const blockNumbersCache =
    cachedState && cachedState.blockNumbersCache
      ? cachedState.blockNumbersCache
      : await initializeBlockNumbersCache(cachedState, initialBlock, agentAddress, settings);
  const nextState = {
    agentAddress,
    cfaAddress: cfa.address,
    superTokens: [],
    flows: [],
    blockNumbersCache,
    initialBlock,
    ...cachedState,
    isSyncing: true,
  };

  const topicsReceiver = [
    sha3(FLOW_UPDATED_SIGNATURE),
    null,
    null,
    AbiCoder.encodeParameter('address', agentAddress),
  ];
  const topicsSender = [
    sha3(FLOW_UPDATED_SIGNATURE),
    null,
    AbiCoder.encodeParameter('address', agentAddress),
  ];
  // Store subscriptions for when setting a new agent
  subscribeToExternals(
    app,
    [getExternal(agentAddress, agentABI), cfa, cfa],
    [undefined, topicsReceiver, topicsSender],
    nextState.blockNumbersCache,
    initialBlock
  );

  console.log('Returning new Initial State');
  console.log(nextState);
  return nextState;
};

const getInitialBlock = async agentAddress => {
  const agent = app.external(agentAddress, agentABI);
  return parseInt(await agent.getInitializationBlock().toPromise());
};
const initializeBlockNumbersCache = async (
  cachedState,
  initializationBlock,
  agentAddress,
  settings
) => {
  if (cachedState && cachedState.blockNumbersCache) {
    return cachedState.blockNumbersCache;
  }

  return {
    [agentAddress]: initializationBlock,
    [settings.superfluid.cfa.address]: initializationBlock,
  };
};
