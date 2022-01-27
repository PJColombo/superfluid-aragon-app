import { BN } from 'bn.js';
import { concat, from } from 'rxjs';
import { endWith, first, mergeMap, startWith } from 'rxjs/operators';
import { addressesEqual, isTestNetwork } from '../helpers';
import { getTokenListUrlByNetwork } from '../helpers/token-list';
import cfaV1ABI from '../abi/CFAv1.json';
import governanceABI from '../abi/Governance.json';
import hostABI from '../abi/Host.json';
import { updateSuperTokens } from './updaters';

const REORG_SAFETY_BLOCK_AGE = 100;

// Custom subscription events to external contracts
export const EXTERNAL_SUBSCRIPTION_SYNCING = 'EXTERNAL_SUBSCRIPTION_SYNCING';
export const EXTERNAL_SUBSCRIPTION_CACHED = 'EXTERNAL_SUBSCRIPTION_CACHED';
export const EXTERNAL_SUBSCRIPTION_SYNCED = 'EXTERNAL_SUBSCRIPTION_SYNCED';
export const EXTERNAL_SUBSCRIPTIONS_SYNCING = 'EXTERNAL_SUBSCRIPTIONS_SYNCING';
export const EXTERNAL_SUBSCRIPTIONS_SYNCED = 'EXTERNAL_SUBSCRIPTIONS_SYNCED';

export const fetchTokenList = async network => {
  const tokenListUrl = getTokenListUrlByNetwork(network);

  const response = await fetch(tokenListUrl);
  const tokenList = await response.json();

  const tokens = tokenList.tokens;

  return isTestNetwork(network)
    ? tokens
    : tokens.filter(({ chainId }) => chainId === Number(network.id));
};

export const createSettings = async app => {
  const cfaAddress = await app.call('cfa').toPromise();
  const cfa = { address: cfaAddress, contract: app.external(cfaAddress, cfaV1ABI) };
  const hostAddress = await app.call('host').toPromise();
  const host = { address: hostAddress, contract: app.external(hostAddress, hostABI) };
  const governanceAddress = await host.contract.getGovernance().toPromise();
  const governance = {
    address: governanceAddress,
    contract: app.external(governanceAddress, governanceABI),
  };

  const network = await app
    .network()
    .pipe(first())
    .toPromise();

  const tokenList = await fetchTokenList(network);

  return {
    network,
    superfluid: {
      cfa,
      governance,
      host,
    },
    tokenList,
  };
};

/*
 * Calls `callback` exponentially, everytime `retry()` is called.
 * Returns a promise that resolves with the callback's result if it (eventually) succeeds.
 *
 * Usage:
 *
 * retryEvery(retry => {
 *  // do something
 *
 *  if (condition) {
 *    // retry in 1, 2, 4, 8 seconds… as long as the condition passes.
 *    retry()
 *  }
 * }, 1000, 2)
 *
 */

export const retryEvery = async (
  callback,
  { initialRetryTimer = 1000, increaseFactor = 3, maxRetries = 3 } = {}
) => {
  const sleep = time => new Promise(resolve => setTimeout(resolve, time));

  let retryNum = 0;
  const attempt = async (retryTimer = initialRetryTimer) => {
    try {
      return await callback();
    } catch (err) {
      if (retryNum === maxRetries) {
        throw err;
      }
      ++retryNum;

      // Exponentially backoff attempts
      const nextRetryTime = retryTimer * increaseFactor;
      console.log(`Retrying in ${nextRetryTime}s... (attempt ${retryNum} of ${maxRetries})`);
      await sleep(nextRetryTime);
      return attempt(nextRetryTime);
    }
  };

  return attempt();
};

export const subscribeToExternals = (
  app,
  externalApps,
  topics = [],
  blockNumbersCache,
  currentBlock,
  initialBlock
) =>
  Promise.all(
    externalApps.map((externalApp, index) =>
      subscribeToExternal(
        app,
        externalApp,
        topics[index],
        blockNumbersCache,
        currentBlock,
        initialBlock,
        index === 0 ? [{ event: EXTERNAL_SUBSCRIPTIONS_SYNCING }] : [],
        index === externalApps.length - 1 ? [{ event: EXTERNAL_SUBSCRIPTIONS_SYNCED }] : []
      )
    )
  );

export const subscribeToExternal = async (
  app,
  external,
  topics,
  blockNumbersCache,
  currentBlock,
  initialBlock = 0,
  customInitialEvents = [],
  customFinalEvents = []
) => {
  const topicsField = !!topics && { topics };
  const contractAddress = external.address;
  const contract = external.contract;
  const cachedBlockNumber = blockNumbersCache[contractAddress];

  const cachedPastEventsToBlock = Math.max(
    initialBlock + currentBlock - REORG_SAFETY_BLOCK_AGE,
    initialBlock
  ); // clamp to 0 for safety
  const cachedPastEventsFromBlock = cachedBlockNumber
    ? Math.min(cachedBlockNumber + 1, cachedPastEventsToBlock)
    : undefined;
  const nonCachedPastEventsToBlock = currentBlock - 1;
  const nonCachedPastEventsFromBlock = Math.min(
    cachedPastEventsToBlock + 1,
    nonCachedPastEventsToBlock
  );

  console.log(
    `Subscribing to ${contractAddress}.
      - Caching events from ${cachedPastEventsFromBlock} to ${cachedPastEventsToBlock}.
      - Listening to last past events from ${nonCachedPastEventsFromBlock} to ${nonCachedPastEventsToBlock}
      - Listening to current events from ${currentBlock}.`
  );

  const pastEvents$ = contract
    .pastEvents({
      ...topicsField,
      // When using cache, fetch events from the next block after cache
      fromBlock: cachedPastEventsFromBlock,
      toBlock: cachedPastEventsToBlock,
    })
    .pipe(
      mergeMap(pastEvents => from(pastEvents)),
      startWith(
        ...[
          ...customInitialEvents,
          {
            event: EXTERNAL_SUBSCRIPTION_SYNCING,
            returnValues: {
              address: contractAddress,
              blockNumber: cachedPastEventsFromBlock,
            },
          },
        ]
      ),
      endWith({
        event: EXTERNAL_SUBSCRIPTION_CACHED,
        returnValues: {
          address: contractAddress,
          blockNumber: cachedPastEventsToBlock,
        },
      })
    );
  const lastEvents$ = contract
    .pastEvents({
      ...topicsField,
      fromBlock: nonCachedPastEventsFromBlock,
      toBlock: nonCachedPastEventsToBlock,
    })
    .pipe(
      mergeMap(pastEvents => from(pastEvents)),
      endWith(
        ...[
          {
            event: EXTERNAL_SUBSCRIPTION_SYNCED,
            returnValues: {
              address: contractAddress,
              blockNumber: nonCachedPastEventsToBlock,
            },
          },
          ...customFinalEvents,
        ]
      )
    );
  const currentEvents$ = contract.events({
    ...topicsField,
    fromBlock: currentBlock,
  });

  return concat(pastEvents$, lastEvents$, currentEvents$).subscribe(
    ({ event, returnValues, address, blockNumber }) =>
      app.emitTrigger(event, {
        ...returnValues,
        _address: address,
        _blockNumber: blockNumber,
      })
  );
};

export const getFlowEventEntity = ({ returnValues: { sender, receiver } }, isIncomingFlow) =>
  isIncomingFlow ? sender : receiver;

export const isFlowEqual = (flow, event) =>
  !flow.isCancelled &&
  addressesEqual(flow.superTokenAddress, event.returnValues.token) &&
  addressesEqual(flow.entity, getFlowEventEntity(event, flow.isIncoming));

export const calculateNewAccumulatedAmount = (oldFlow, currentTimestamp) => {
  const { accumulatedAmount, lastTimestamp, flowRate } = oldFlow;

  return new BN(currentTimestamp - lastTimestamp)
    .mul(new BN(flowRate))
    .add(new BN(accumulatedAmount))
    .toString();
};

export const loadInitialSuperTokens = async (
  state,
  initialSTAddresses,
  currentBlock,
  app,
  settings
) => {
  const nextState = {
    ...state,
  };

  if (!Array.isArray(nextState.superTokens) && !Array.isArray(initialSTAddresses)) {
    return nextState;
  }

  const currentSuperTokenAddress = new Set(
    nextState.superTokens.map(({ address }) => address).concat(initialSTAddresses)
  );

  const { timestamp } = await app.web3Eth('getBlock', currentBlock).toPromise();

  console.log(currentSuperTokenAddress);
  for (const superTokenAddress of currentSuperTokenAddress) {
    nextState.superTokens = await updateSuperTokens(
      nextState,
      app,
      settings,
      superTokenAddress,
      timestamp
    );
  }

  return nextState;
};
