const deployFramework = require('@superfluid-finance/ethereum-contracts/scripts/deploy-framework');
const deploySuperToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-super-token');
const deployTestToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-test-token');
const SuperfluidSDK = require('@superfluid-finance/js-sdk');
const { utils } = require('ethers');
const { ANY_ENTITY, createAppPermission } = require('./acl');
const { getSuperTokenName } = require('./tokens');

const handleError = (err) => {
  if (err) {
    throw err;
  }
};

module.exports.sendTokensToAgent = async (sf, flowFinance, sender, tokens, amount) => {
  const testToken = sf.tokens[tokens[0]];
  const superToken = sf.superTokens[getSuperTokenName(tokens[0])];
  // const flowSuperToken = sf.superTokens[getSuperTokenName(tokens[0])];
  // const agentAddress = await flowFinance.agent();
  // const flowAmount = ONE_TOKEN.mul(2)
  //   .div(3600 * 24 * 30)
  //   .toString();

  await testToken.approve(superToken.address, amount, { from: sender });
  await superToken.upgrade(amount, { from: sender });

  await superToken.approve(flowFinance.address, amount, { from: sender });
  await flowFinance.deposit(superToken.address, amount, true, { from: sender });

  // Create an incoming flow
  // await flowSuperToken.approve(flowFinance.address, amount, { from: sender });
  // await flowFinance.deposit(flowSuperToken.address, amount, true, { from: sender });
  // await flowFinance.createFlow(flowSuperToken.address, agentAddress, flowAmount, { from: sender });
};

module.exports.setUpSuperfluid = async (
  tokens,
  web3,
  deployer,
  cb = () => {},
  log = console.log
) => {
  log('Deploying Superfluid framework...');

  const options = {
    from: deployer,
    isTruffle: false,
    web3,
    loadSuperNativeToken: true,
  };

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

module.exports.setUpAgent = async (dao, artifacts, log = console.log) => {
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

  await createAppPermission(acl, agent.address, await agent.TRANSFER_ROLE());
  await createAppPermission(acl, agent.address, await agent.SAFE_EXECUTE_ROLE());

  log("Agent's permissions set up");

  return agent;
};
