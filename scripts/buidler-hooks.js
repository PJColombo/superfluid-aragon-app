/* eslint-disable no-empty-pattern */
/*
 * These hooks are called by the Aragon Buidler plugin during the start task's lifecycle. Use them to perform custom tasks at certain entry points of the development build process, like deploying a token before a proxy is initialized, etc.
 *
 * Link them to the main buidler config file (buidler.config.js) in the `aragon.hooks` property.
 *
 * All hooks receive two parameters:
 * 1) A params object that may contain other objects that pertain to the particular hook.
 * 2) A "bre" or BuidlerRuntimeEnvironment object that contains enviroment objects like web3, Truffle artifacts, etc.
 *
 * Please see AragonConfigHooks, in the plugin's types for further details on these interfaces.
 * https://github.com/aragon/buidler-aragon/blob/develop/src/types.ts#L22
 */

const deployFramework = require('@superfluid-finance/ethereum-contracts/scripts/deploy-framework');
const deploySuperToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-super-token');
const deployTestToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-test-token');
const SuperfluidSDK = require('@superfluid-finance/js-sdk');
const { utils, BigNumber } = require('ethers');

const TOKENS = ['fDAI', 'fUSDC'];
const ONE_TOKEN = BigNumber.from((1e18).toString());
const INITIAL_BALANCE = ONE_TOKEN.mul(5000);
const ANY_ENTITY = '0x' + 'F'.repeat(40);

let sf;
let agent;

module.exports = {
  // Called before a dao is deployed.
  preDao: async ({ log }, { artifacts, web3 }) => {
    const [root] = await web3.eth.getAccounts();

    sf = await setUpSuperfluid(TOKENS, web3, root, handleError, log);
  },

  // Called after a dao is deployed.
  postDao: async ({ dao, log }, { web3, artifacts }) => {
    agent = await setUpAgent(dao, artifacts, log);
  },

  // Called after the app's proxy is created, but before it's initialized.
  preInit: async ({ proxy }, { web3, artifacts }) => {},

  // Called after the app's proxy is initialized.
  postInit: async ({ proxy, log }, { web3, artifacts }) => {
    const [, testAccount, receiver0, sender] = await web3.eth.getAccounts();

    log(`Minting test tokens for testing accounts...`);
    await mintTestTokens(sf, testAccount, TOKENS, artifacts, log);
    await mintTestTokens(sf, receiver0, TOKENS, artifacts, log);
    await mintTestTokens(sf, sender, TOKENS, artifacts, log);

    log('Send super tokens to agent.');
    await sendTokensToAgent(sf, proxy, sender, TOKENS);
  },

  // Called when the start task needs to know the app proxy's init parameters.
  // Must return an array with the proxy's init parameters.
  getInitParams: async ({}, { web3, artifacts }) => {
    return [agent.address, sf.host.address, sf.agreements.cfa.address];
  },

  // Called after the app's proxy is updated with a new implementation.
  postUpdate: async ({ proxy }, { web3, artifacts }) => {},
};

const handleError = (err) => {
  if (err) {
    throw err;
  }
};

const mintTestTokens = async (sf, recipient, tokens, artifacts, log = console.log) => {
  const FakeToken = artifacts.require('FakeToken');
  for (tokenName of tokens) {
    /**
     * Need to instantiate contract using FakeToken interface as the one provided by Superfluid
     * doesn't have the mint() function
     */
    const fakeToken = await FakeToken.at(sf.tokens[tokenName].address);
    await fakeToken.methods['mint(address,uint256)'](recipient, INITIAL_BALANCE);

    log(`${INITIAL_BALANCE} tokens minted for test account: ${recipient}`);
  }
};

const setUpSuperfluid = async (tokens, web3, deployer, cb = () => {}, log = console.log) => {
  log('Deploying Superfluid framework...');

  const options = { from: deployer, isTruffle: false, web3 };

  await deployFramework(cb, options);

  for (const tokenName of tokens) {
    log(`Deploying super token and test token ${tokenName}...`);
    await deployTestToken(handleError, [':', tokenName], options);
    await deploySuperToken(handleError, [':', tokenName], options);

    log(`Tokens ${tokenName} deployed.`);
  }

  log(`Initialize Superfluid Framework`);
  const sf = new SuperfluidSDK.Framework({ tokens: tokens, web3, version: 'test' });

  await sf.initialize();

  return sf;
};

const setUpAgent = async (dao, artifacts, log = console.log) => {
  const ACL = artifacts.require('ACL');
  const acl = await ACL.at(await dao.acl());
  const Agent = artifacts.require('Agent');
  const agentBase = await Agent.new();
  const appId = utils.namehash('agent.aragonpm.eth');

  log('Creating agent...');

  const receipt = await dao.methods['newAppInstance(bytes32,address,bytes,bool)'](
    appId,
    agentBase.address,
    '0x',
    false
  );

  const event = receipt.logs.find((log) => log.event === 'NewAppProxy' && log.args.appId === appId);

  const agent = await Agent.at(event.args.proxy);

  await agent.initialize();

  log(`Proxy address: ${agent.address}.`);

  await createAppPermission(acl, agent.address, await agent.SAFE_EXECUTE_ROLE());

  log("Agent's permissions set up");

  return agent;
};

const createAppPermission = (acl, appAddress, appPermission) =>
  acl.createPermission(ANY_ENTITY, appAddress, appPermission, ANY_ENTITY);

const sendTokensToAgent = async (sf, flowFinance, sender, tokens) => {
  const testToken = await sf.tokens[tokens[0]];
  const superToken = sf.superTokens[`${tokens[0]}x`];
  const amount = INITIAL_BALANCE.div(2);

  await testToken.approve(superToken.address, amount, { from: sender });
  await superToken.upgrade(amount, { from: sender });

  await superToken.approve(flowFinance.address, amount, { from: sender });
  await flowFinance.deposit(superToken.address, amount, true, { from: sender });
};
