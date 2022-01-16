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

const { sendTokensToAgent, setUpAgent, setUpSuperfluid } = require('./helpers/prepare');
const { NATIVE_TOKEN, ONE_TOKEN, mintTestTokens, upgradeTokens } = require('./helpers/tokens');

const TOKENS = ['fDAI', 'fUSDC', 'fTUSDC', NATIVE_TOKEN];
const INITIAL_BALANCE = ONE_TOKEN.mul(15000);

let sf;
let agent;

module.exports = {
  // Called before a dao is deployed.
  preDao: async ({ log }, { artifacts, web3 }) => {
    const [root] = await web3.eth.getAccounts();

    sf = await setUpSuperfluid(
      TOKENS,
      web3,
      root,
      (err) => {
        if (err) {
          throw err;
        }
      },
      log
    );
  },

  // Called after a dao is deployed.
  postDao: async ({ dao, log }, { web3, artifacts }) => {
    agent = await setUpAgent(dao, artifacts, log);
  },

  // Called after the app's proxy is created, but before it's initialized.
  preInit: async ({ proxy }, { web3, artifacts }) => {},

  // Called after the app's proxy is initialized.
  postInit: async ({ proxy, log }, { web3, artifacts }) => {
    const [testAccount, receiver0, sender] = await web3.eth.getAccounts();

    const accounts = [testAccount, receiver0, sender];
    log(`Minting test tokens for testing accounts...`);
    await mintTestTokens(sf, accounts, TOKENS, INITIAL_BALANCE, artifacts, log);

    log(`Upgrading testing accounts tokens to super tokens...`);
    await upgradeTokens(sf, TOKENS, accounts, INITIAL_BALANCE.div(3), log);

    log('Prepare ');
    await sendTokensToAgent(sf, proxy, sender, TOKENS, INITIAL_BALANCE.div(3));
  },

  // Called when the start task needs to know the app proxy's init parameters.
  // Must return an array with the proxy's init parameters.
  getInitParams: async ({}, { web3, artifacts }) => {
    return [agent.address, sf.host.address, sf.agreements.cfa.address];
  },

  // Called after the app's proxy is updated with a new implementation.
  postUpdate: async ({ proxy }, { web3, artifacts }) => {},
};
