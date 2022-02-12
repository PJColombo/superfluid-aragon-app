import Aragon, { events } from '@aragon/api';
import 'regenerator-runtime/runtime';
import AbiCoder from 'web3-eth-abi';
import { sha3 } from 'web3-utils';
import agentABI from './abi/Agent.json';
import {
  createSettings,
  EXTERNAL_SUBSCRIPTION_SYNCED,
  loadInitialSuperTokens,
  retryEvery,
  subscribeToExternals,
} from './store/helpers';
import { handleFlowUpdated, handleVaultEvent } from './store/event-handlers';
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
  const agent = getExternal(agentAddress, agentABI);

  return app.store(
    async (state, event) => {
      const { event: eventName } = event;
      console.log(
        'Receiving event: ',
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
            return { ...state, isSyncing: true, cachedBlockNumber: event.returnValues.to };
          case EXTERNAL_SUBSCRIPTION_SYNCED:
            return { ...state, isSyncing: false };
          default:
            return state;
        }
      } catch (err) {
        console.log(err);
      }
    },
    {
      init: initializeState(agent, settings),
    }
  );
};

const initializeState = (agent, settings) => async cachedState => {
  console.log('Cached State:');
  console.log(cachedState);

  const {
    superfluid: { cfa, host },
  } = settings;
  const initialBlock =
    cachedState && cachedState.initialBlock
      ? cachedState.initialBlock
      : await getAgentInitializationBlock(agent);
  const nextState = {
    agentAddress: agent.address,
    cfaAddress: cfa.address,
    hostAddress: host.address,
    superTokens: [],
    flows: [],
    sendersSuperTokens: {},
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
    AbiCoder.encodeParameter('address', agent.address),
  ];
  const topicsSender = [
    sha3(FLOW_UPDATED_SIGNATURE),
    null,
    AbiCoder.encodeParameter('address', agent.address),
  ];

  subscribeToExternals(
    app,
    [agent, cfa, cfa],
    [undefined, topicsReceiver, topicsSender],
    cachedState ? cachedState.cachedBlockNumber : null,
    currentBlock,
    initialBlock
  );

  return nextStateWithInitialSTs;
};

const getAgentInitializationBlock = async agent => {
  return parseInt(await agent.contract.getInitializationBlock().toPromise());
};
