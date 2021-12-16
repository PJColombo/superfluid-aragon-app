import { addressesEqual } from '@aragon/ui';
import { concat, from } from 'rxjs';
import { endWith, first, mergeMap, startWith } from 'rxjs/operators';
import cfaV1ABI from '../abi/CFAv1.json';

const REORG_SAFETY_BLOCK_AGE = 100;

// Custom subscription events to external contracts
export const EXTERNAL_SUBSCRIPTION_SYNCING = 'EXTERNAL_SUBSCRIPTION_SYNCING';
export const EXTERNAL_SUBSCRIPTION_CACHED = 'EXTERNAL_SUBSCRIPTION_CACHED';
export const EXTERNAL_SUBSCRIPTION_SYNCED = 'EXTERNAL_SUBSCRIPTION_SYNCED';

export const createSettings = async app => {
  const cfaAddress = await app.call('cfa').toPromise();
  const cfa = { address: cfaAddress, contract: app.external(cfaAddress, cfaV1ABI) };

  const network = await app
    .network()
    .pipe(first())
    .toPromise();
  return {
    network,
    superfluid: {
      cfa,
    },
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

export const subscribeToExternals = (app, externalApps, topics, blockNumbersCache) =>
  Promise.all(
    externalApps.map((externalApp, index) =>
      subscribeToExternal(app, externalApp, topics[index], blockNumbersCache)
    )
  );

export const subscribeToExternal = async (app, external, topics, blockNumbersCache) => {
  const topicsField = !!topics && { topics };
  const contractAddress = external.address;
  const contract = external.contract;
  const cachedBlockNumber = blockNumbersCache[contractAddress];

  const currentBlock = await app.web3Eth('getBlockNumber').toPromise();
  const cacheBlockHeight = Math.max(
    currentBlock - REORG_SAFETY_BLOCK_AGE,
    cachedBlockNumber + 1 || 0
  ); // clamp to 0 for safety

  console.log(
    `Subscribing to ${contractAddress}.
      - Caching events from ${cachedBlockNumber} to ${cacheBlockHeight}.
      - Listening to past events from ${cacheBlockHeight + 1} to ${currentBlock}.
      - Listening to current events from ${currentBlock}.`
  );

  const pastEvents$ = contract
    .pastEvents({
      ...topicsField,
      // When using cache, fetch events from the next block after cache
      fromBlock: cachedBlockNumber ? cachedBlockNumber + 1 : undefined,
      toBlock: cacheBlockHeight,
    })
    .pipe(
      mergeMap(pastEvents => from(pastEvents)),
      startWith({
        event: EXTERNAL_SUBSCRIPTION_SYNCING,
        returnValues: {
          address: contractAddress,
          from: cachedBlockNumber,
          to: cacheBlockHeight,
        },
      }),
      endWith({
        event: EXTERNAL_SUBSCRIPTION_CACHED,
        returnValues: {
          address: contractAddress,
          blockNumber: cacheBlockHeight,
        },
      })
    );
  const lastEvents$ = contract
    .pastEvents({
      ...topicsField,
      fromBlock: cacheBlockHeight + 1,
      toBlock: currentBlock - 1,
    })
    .pipe(
      mergeMap(pastEvents => {
        return from(pastEvents);
      }),
      endWith({
        event: EXTERNAL_SUBSCRIPTION_SYNCED,
        returnValues: {
          address: contractAddress,
          from: cacheBlockHeight + 1,
          toBlock: currentBlock - 1,
        },
      })
    );
  const currentEvents$ = contract.events({
    ...topicsField,
    fromBlock: currentBlock,
  });

  return concat(
    pastEvents$,
    lastEvents$,
    currentEvents$
  ).subscribe(({ event, returnValues, address }) =>
    app.emitTrigger(event, { ...returnValues, contractAddress: address })
  );
};

export const isFlowEqual = (flow, event, flowType) => {
  const field = flowType === 'inFlows' ? 'sender' : 'receiver';
  return (
    addressesEqual(flow.superTokenAddress, event.token) && addressesEqual(flow[field], event[field])
  );
};

export const calculateFlowAmount = (currentTimestamp, lastTimestamp, flowRate) =>
  currentTimestamp.sub(lastTimestamp).mul(flowRate);
