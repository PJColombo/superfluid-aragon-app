import Aragon, { events } from '@aragon/api';
import agentABI from './abi/Agent.json';

import 'regenerator-runtime/runtime';
import {
  createSettings,
  EXTERNAL_SUBSCRIPTIONS_SYNCED,
  EXTERNAL_SUBSCRIPTION_CACHED,
  loadInitialSuperTokens,
  retryEvery,
  subscribeToExternals,
} from './store/helpers';
import { handleFlowUpdated, handleVaultEvent } from './store/event-handlers';
import { sha3 } from 'web3-utils';
import AbiCoder from 'web3-eth-abi';
import { PRESET_SUPER_TOKENS } from './store/preset-super-tokens';

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
      console.log(
        'Reciving event: ',
        eventName,
        ' at block ',
        event.returnValues._blockNumber || event.returnValues.blockNumber
      );

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
    superfluid: { cfa, host },
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
    hostAddress: host.address,
    superTokens: [],
    flows: [],
    sendersSuperTokens: {},
    blockNumbersCache,
    initialBlock,
    ...cachedState,
    isSyncing: true,
  };
  const currentBlock = await app.web3Eth('getBlockNumber').toPromise();

  const nextStateWithInitialSTs = await loadInitialSuperTokens(
    nextState,
    PRESET_SUPER_TOKENS.get(settings.network.id),
    currentBlock,
    app,
    settings
  );

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

  subscribeToExternals(
    app,
    [getExternal(agentAddress, agentABI), cfa, cfa],
    [undefined, topicsReceiver, topicsSender],
    nextStateWithInitialSTs.blockNumbersCache,
    currentBlock,
    initialBlock
  );

  console.log('Returning new Initial State');
  console.log(nextStateWithInitialSTs);
  return nextStateWithInitialSTs;
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
