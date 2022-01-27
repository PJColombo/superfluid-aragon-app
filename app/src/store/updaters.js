import Web3EthAbi from 'web3-eth-abi';
import superTokenABI from '../abi/SuperToken.js';
import { isTestNetwork } from '../helpers/network.js';
import { getFakeTokenSymbol, getNativeCurrencyLogo, loadTokenData } from '../helpers/token.js';
import { addressesEqual, ZERO_ADDRESS } from '../helpers/web3.js';
import { calculateNewAccumulatedAmount, getFlowEventEntity, isFlowEqual } from './helpers';

const superTokenContracts = new Map();

const getSuperTokenContract = (tokenAddress, app) => {
  const tokenContract = superTokenContracts.has(tokenAddress)
    ? superTokenContracts.get(tokenAddress)
    : app.external(tokenAddress, superTokenABI);
  superTokenContracts.set(tokenAddress, tokenContract);

  return tokenContract;
};

export const updateSuperTokens = async (
  { superTokens: oldSuperTokens, agentAddress },
  app,
  settings,
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
      ...(await newSuperToken(tokenAddress, tokenContract, app, settings)),
    };
  } else {
    updatedToken = {
      ...oldSuperTokens[superTokenIndex],
    };
  }

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

export const updateFlows = (state, event, updateTimestamp) => {
  const { agentAddress } = state;
  const { receiver, flowRate, token: tokenAddress, userData } = event.returnValues;
  const newFlows = [...state.flows];

  const isIncoming = addressesEqual(receiver, agentAddress);
  const flowIndex = newFlows.findIndex(flow => isFlowEqual(flow, event));
  const flowExists = !!newFlows[flowIndex];
  const description = userData ? Web3EthAbi.decodeParameter('string', userData) : '';

  // Create flow case
  if (!flowExists) {
    newFlows.push({
      isCancelled: false,
      isIncoming,
      entity: getFlowEventEntity(event, isIncoming),
      superTokenAddress: tokenAddress,
      accumulatedAmount: '0',
      creationTimestamp: updateTimestamp,
      lastTimestamp: updateTimestamp,
      flowRate,
      description,
    });
  }
  // Update flow case
  else if (flowExists && flowRate > 0) {
    newFlows[flowIndex] = {
      ...newFlows[flowIndex],
      accumulatedAmount: calculateNewAccumulatedAmount(state.flows[flowIndex], updateTimestamp),
      lastTimestamp: updateTimestamp,
      flowRate,
      description,
    };
  }
  // Delete flow case
  else {
    newFlows[flowIndex] = {
      ...newFlows[flowIndex],
      accumulatedAmount: calculateNewAccumulatedAmount(state.flows[flowIndex], updateTimestamp),
      lastTimestamp: updateTimestamp,
      isCancelled: true,
    };
  }

  return newFlows;
};

export const updateSendersSuperTokens = async (state, event, updateTimestamp) => {
  const { agentAddress } = state;
  const { receiver, sender, totalSenderFlowRate, token } = event.returnValues;
  const isIncoming = addressesEqual(agentAddress, receiver);
  const newSendersSuperTokens = { ...state.sendersSuperTokens };

  if (!isIncoming) {
    return newSendersSuperTokens;
  }

  const senderSuperTokens = newSendersSuperTokens[sender];

  // Create a new entry
  if (!senderSuperTokens) {
    newSendersSuperTokens[sender] = [
      await newSuperTokenEntry(sender, token, totalSenderFlowRate, updateTimestamp),
    ];
  } else {
    let newSenderSuperTokens = senderSuperTokens.filter(
      superToken => !addressesEqual(superToken.address, token)
    );

    // Include updated Super Token entry only if it has not ended (net flow equal to zero)
    if (totalSenderFlowRate !== 0) {
      newSenderSuperTokens.push(
        await newSuperTokenEntry(sender, token, totalSenderFlowRate, updateTimestamp)
      );

      newSendersSuperTokens[sender] = newSenderSuperTokens;
    }
  }

  return newSendersSuperTokens;
};

const newSuperTokenEntry = async (sender, tokenAddress, netFlow, updateTimestamp) => {
  const tokenContract = getSuperTokenContract(tokenAddress);
  const balance = await tokenContract.balanceOf(sender).toPromise();

  return { address: tokenAddress, balance, netFlow, lastUpdateTimestamp: updateTimestamp };
};

const newSuperToken = async (superTokenAddress, superTokenContract, app, settings) => {
  const {
    network,
    superfluid: { governance, host },
    tokenList,
  } = settings;

  const [[decimals, name, symbol], underlyingTokenAddress, liquidationPeriod] = await Promise.all([
    loadTokenData(superTokenContract, app, settings.network),
    superTokenContract.getUnderlyingToken().toPromise(),
    governance.contract.getCFAv1LiquidationPeriod(host.address, superTokenAddress).toPromise(),
  ]);

  let mainnetTokenEquivalentAddress, logoURI, underlyingDecimals, underlyingName, underlyingSymbol;
  let token;

  /**
   * For test networks fetch the underlying token data directly from the contract as we're using a mainnet token list
   */
  if (isTestNetwork(network)) {
    [underlyingDecimals, underlyingName, underlyingSymbol] = await loadTokenData(
      underlyingTokenAddress,
      app,
      settings.network
    );

    const tokenSymbol = getFakeTokenSymbol(underlyingSymbol);
    token = tokenList.find(({ symbol }) => symbol === tokenSymbol);

    if (token) {
      logoURI = token.logoURI;
      mainnetTokenEquivalentAddress = token.address;
    } else if (addressesEqual(underlyingTokenAddress, ZERO_ADDRESS)) {
      logoURI = getNativeCurrencyLogo(tokenSymbol);
    }
  } else {
    token = !addressesEqual(underlyingTokenAddress, ZERO_ADDRESS)
      ? tokenList.find(({ address }) => addressesEqual(address, underlyingTokenAddress))
      : null;

    if (token) {
      logoURI = token.logoURI;
      underlyingDecimals = token.decimals;
      underlyingName = token.name;
      underlyingSymbol = token.symbol;
    } else {
      [underlyingDecimals, underlyingName, underlyingSymbol] = await loadTokenData(
        underlyingTokenAddress,
        app,
        settings.network
      );

      if (addressesEqual(underlyingTokenAddress, ZERO_ADDRESS)) {
        logoURI = getNativeCurrencyLogo(underlyingSymbol);
      }
    }
  }

  return {
    address: superTokenAddress,
    decimals,
    liquidationPeriodSeconds: liquidationPeriod,
    name,
    symbol,
    underlyingToken: {
      address: underlyingTokenAddress,
      name: underlyingName,
      decimals: underlyingDecimals,
      symbol: underlyingSymbol,
    },
    logoURI,
    // Needed for displaying conversion rates on test networks,
    mainnetTokenEquivalentAddress,
    balance: 0,
    netFlow: 0,
  };
};
