import Aragon, { events } from '@aragon/api';
import agentABI from './abi/Agent.json';

import 'regenerator-runtime/runtime';
import {
  createSettings,
  EXTERNAL_SUBSCRIPTION_CACHED,
  EXTERNAL_SUBSCRIPTION_SYNCED,
  EXTERNAL_SUBSCRIPTION_SYNCING,
  retryEvery,
  subscribeToExternals,
} from './store/helpers';
import { handleFlowUpdated, handleSetAgent, handleVaultEvent } from './store/event-handlers';

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
      console.log('Receiving event: ', eventName);

      try {
        // Superfluid events
        if (eventName === 'FlowUpdated') {
          return handleFlowUpdated(state, event, app, settings);
        }

        // Agent events
        if (eventName === 'VaultTransfer' || eventName === 'VaultDeposit') {
          return handleVaultEvent(state, event, app);
        }

        // App events
        switch (eventName) {
          case events.SYNC_STATUS_SYNCING:
            return { ...state, isSyncing: true };
          case events.SYNC_STATUS_SYNCED:
            return { ...state, isSyncing: false };

          // Custom external subscriptions events
          case EXTERNAL_SUBSCRIPTION_SYNCING:
            return { ...state, isSyncing: true };
          case EXTERNAL_SUBSCRIPTION_CACHED:
            const { address: externalAddress, blockNumber } = event.returnValues;
            return {
              ...state,
              isSyncing: true,
              blockNumbersCache: {
                ...state.blockNumbersCache,
                [externalAddress]: blockNumber,
              },
            };
          case EXTERNAL_SUBSCRIPTION_SYNCED: {
            return {
              ...state,
              isSyncing: false,
            };
          }

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
  const {
    superfluid: { cfa },
  } = settings;
  console.log('Initializing state');
  console.log(cachedState);

  const blockNumbersCache = await getBlockNumbersCache(cachedState, agentAddress, settings);
  // Store subscriptions for when setting a new agent
  subscribeToExternals(
    app,
    [getExternal(agentAddress, agentABI), cfa, cfa],
    [undefined, { sender: agentAddress }, { receiver: agentAddress }],
    blockNumbersCache
  );

  return {
    ...cachedState,
    agentAddress,
    superTokens: {},
    isSyncing: true,
    // subscriptions,
    blockNumbersCache: {},
  };
};

const getBlockNumbersCache = async (cachedState, agentAddress, settings) => {
  if (cachedState && cachedState.blockNumbersCache) {
    return cachedState.blockNumbersCache;
  } else {
    const agent = app.external(agentAddress, agentABI);
    const initializationBlock = await agent.getInitializationBlock().toPromise();

    return {
      [agentAddress]: initializationBlock,
      [settings.superfluid.cfa.address]: initializationBlock,
    };
  }
};
