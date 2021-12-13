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

export const subscribeToExternals = (app, externalApps, filters, blockNumbersCache) =>
  Promise.all(
    externalApps.map((externalApp, index) =>
      subscribeToExternal(app, externalApp, filters[index], blockNumbersCache)
    )
  );

export const subscribeToExternal = async (app, external, filters, blockNumbersCache) => {
  const contractAddress = external.address;
  const contract = external.contract;
  const cachedBlockNumber = blockNumbersCache[contractAddress];

  console.log(`Subscribing to ${contractAddress} with cached block number ${cachedBlockNumber}…`);

  const currentBlock = await app.web3Eth('getBlockNumber').toPromise();
  const cacheBlockHeight = Math.max(currentBlock - REORG_SAFETY_BLOCK_AGE, 0); // clamp to 0 for safety
  const pastEvents$ = contract
    .pastEvents({
      ...(!!filters && { filters: { ...filters } }),
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
      ...(!!filters && { filters: { ...filters } }),
      fromBlock: cacheBlockHeight + 1,
      toBlock: currentBlock,
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
          toBlock: currentBlock,
        },
      })
    );
  const currentEvents$ = contract.events({
    ...(!!filters && { filters: { ...filters } }),
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