import { Signer } from '@ethersproject/abstract-signer';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { getDeployments } from '../helpers/configuration';
import { impersonateAddress, takeSnapshot, useSnapshot } from '../helpers/rpc';
import {
  ACL,
  Agent,
  FakeToken,
  FlowFinance,
  IConstantFlowAgreementV1,
  ISuperfluid,
  ISuperToken,
  Kernel
} from '../typechain';
import { installNewApp, newDao, toDecimals } from './helpers';
import { computeFlowRate } from './helpers/superfluid';

const { utils: ethersUtils } = ethers;

const { aragon } = hre.config;
const deployments = getDeployments();

type Flow = [BigNumber, BigNumber, BigNumber, BigNumber] & {
  timestamp: BigNumber;
  flowRate: BigNumber;
  deposit: BigNumber;
  owedDeposit: BigNumber;
};

describe('Flow Finance', () => {
  let root: SignerWithAddress;
  let receiver: SignerWithAddress;
  let permissionlessAccount: SignerWithAddress;
  let nonContractAccount: SignerWithAddress;
  let depositor: SignerWithAddress;

  let dao: Kernel;
  let acl: ACL;
  let flowFinance: FlowFinance;
  let ffAgent: Agent;

  let host: ISuperfluid;
  let cfav1: IConstantFlowAgreementV1;
  let superToken: ISuperToken;
  let fakeToken: FakeToken;

  const appId = ethersUtils.namehash(aragon.appEnsName);

  const TOKEN_AMOUNT = toDecimals(5000);

  let snapshotId: string;

  const generateSuperTokens = async (recipientSigner: Signer) => {
    await fakeToken.mint(await recipientSigner.getAddress(), TOKEN_AMOUNT);
    await fakeToken.connect(recipientSigner).approve(superToken.address, TOKEN_AMOUNT);

    await superToken.connect(recipientSigner).upgrade(TOKEN_AMOUNT);
  };

  const setUpAgent = async (): Promise<Agent> => {
    const agentAddress = await installNewApp(
      dao,
      ethersUtils.namehash('agent.aragonpm.eth'),
      deployments.aragon.agentBase
    );
    const agent = await ethers.getContractAt('Agent', agentAddress, root);

    await agent.initialize();

    await acl.createPermission(
      flowFinance.address,
      agent.address,
      await agent.SAFE_EXECUTE_ROLE(),
      root.address
    );

    return agent;
  };

  const checkFlow = (flow: Flow, expectedFlowData: (BigNumber | BigNumberish)[]) => {
    expect(flow.timestamp, 'Timestamp mismatch').to.equal(expectedFlowData[0]);
    expect(flow.flowRate, 'Flow rate mismatch').to.equal(expectedFlowData[1]);
    expect(flow.deposit, 'Deposit mismatch').to.equal(expectedFlowData[2]);
    expect(flow.owedDeposit, 'Owed deposit mismatch').to.equal(expectedFlowData[3]);
  };

  before('Prepare superfluid contracts', async () => {
    const { superfluid } = deployments;

    host = await ethers.getContractAt('ISuperfluid', superfluid.host, root);
    cfav1 = await ethers.getContractAt('IConstantFlowAgreementV1', superfluid.cfav1, root);
    superToken = await ethers.getContractAt('ISuperToken', superfluid.supertokens[0], root);
    fakeToken = await ethers.getContractAt('FakeToken', superfluid.tokens[0], root);
  });

  before('Create DAO', async () => {
    const daoFactory = await ethers.getContractAt(
      'DAOFactory',
      deployments.aragon.daoFactory,
      root
    );

    [root, receiver, permissionlessAccount, nonContractAccount, depositor] =
      await ethers.getSigners();
    [dao, acl] = await newDao(root, daoFactory);
  });

  before('Install  Finance', async () => {
    const FlowFinance = await ethers.getContractFactory('FlowFinance');
    const FlowFinanceBase = await FlowFinance.deploy();
    const flowFinanceAddress = await installNewApp(dao, appId, FlowFinanceBase.address);
    flowFinance = await ethers.getContractAt('FlowFinance', flowFinanceAddress, root);

    const MANAGE_STREAMS_ROLE = await FlowFinanceBase.MANAGE_STREAMS_ROLE();
    const SET_AGENT_ROLE = await flowFinance.SET_AGENT_ROLE();

    await acl.createPermission(
      root.address,
      flowFinance.address,
      MANAGE_STREAMS_ROLE,
      root.address
    );

    await acl.createPermission(root.address, flowFinance.address, SET_AGENT_ROLE, root.address);
  });

  before('Prepare initialization parameters', async () => {
    ffAgent = await setUpAgent();

    await generateSuperTokens(await impersonateAddress(ffAgent.address));

    snapshotId = await takeSnapshot();
  });

  beforeEach(async () => (snapshotId = await useSnapshot(snapshotId)));

  describe('initialize(Agent _agent,ISuperfluid _host,IConstantFlowAgreementV1 _cfa,address[] _acceptedTokens)', () => {
    it('should revert when passing an invalid agent', async () => {
      await expect(
        flowFinance.initialize(nonContractAccount.address, host.address, cfav1.address)
      ).to.be.revertedWith('FLOW_FINANCE_AGENT_NOT_CONTRACT');
    });

    it('should revert when passing an invalid host', async () => {
      await expect(
        flowFinance.initialize(ffAgent.address, nonContractAccount.address, cfav1.address)
      ).to.be.revertedWith('FLOW_FINANCE_HOST_NOT_CONTRACT');
    });

    it('should revert when passing an invalid cfa', async () => {
      await expect(
        flowFinance.initialize(ffAgent.address, host.address, nonContractAccount.address)
      ).to.be.revertedWith('FLOW_FINANCE_CFA_NOT_CONTRACT');
    });

    it('should initialize the app', async () => {
      await flowFinance.initialize(ffAgent.address, host.address, cfav1.address);

      // await tenderly.persistArtifacts([
      //   { address: flowFinance.address, name: 'FlowFinance' },
      // ]);
      // await tenderly.verify([{ address: flowFinance.address, name: 'FlowFinance' }]);

      snapshotId = await takeSnapshot();
    });
  });

  describe('setAgent(Agent _agent)', () => {
    let newAgent: Agent;

    before(async () => {
      newAgent = await setUpAgent();

      snapshotId = await takeSnapshot();
    });

    it('should emit a correct NewAgentSet event', async () => {
      expect(await flowFinance.setAgent(newAgent.address))
        .to.emit(flowFinance, 'NewAgentSet')
        .withArgs(newAgent.address);
    });

    it('should set a new agent correctly', async () => {
      await flowFinance.setAgent(newAgent.address);

      expect(await flowFinance.agent()).to.be.equal(newAgent.address);
    });

    it('should revert when trying to set a new agent without having the SET_AGENT_ROLE', async () => {
      await expect(
        flowFinance.connect(permissionlessAccount).setAgent(newAgent.address)
      ).to.be.revertedWith('APP_AUTH_FAILED');
    });

    it('should revert when trying to set a non-contract as the new agent', async () => {
      await expect(flowFinance.setAgent(nonContractAccount.address)).to.be.revertedWith(
        'FLOW_FINANCE_AGENT_NOT_CONTRACT'
      );
    });
  });

  describe('deposit(ISuperToken _token, uint256 _amount, bool _isExternalDeposit)', () => {
    let depositSuperToken: ISuperToken;
    let ffDepositor: FlowFinance;

    const DEPOSIT_AMOUNT = toDecimals(3000);

    before(async () => {
      const superTokenAddress = deployments.superfluid.supertokens[1];
      const tokenSigner = await impersonateAddress(superTokenAddress);
      depositSuperToken = await ethers.getContractAt('ISuperToken', superTokenAddress, tokenSigner);
      ffDepositor = flowFinance.connect(depositor);

      await depositSuperToken.connect(depositor).approve(flowFinance.address, DEPOSIT_AMOUNT);
      await depositSuperToken.selfMint(depositor.address, DEPOSIT_AMOUNT, '0x');

      snapshotId = await takeSnapshot();
    });

    it('should deposit tokens correctly', async () => {
      const agentBalanceBefore = await depositSuperToken.balanceOf(ffAgent.address);

      await ffDepositor.deposit(depositSuperToken.address, DEPOSIT_AMOUNT, true);

      const agentBalanceAfter = await depositSuperToken.balanceOf(ffAgent.address);
      const depositorBalanceAfter = await depositSuperToken.balanceOf(depositor.address);

      expect(depositorBalanceAfter).to.equal(0);
      expect(agentBalanceAfter.sub(agentBalanceBefore)).to.equal(DEPOSIT_AMOUNT);
    });

    it('should deposit tokens already transfered to the app', async () => {
      await depositSuperToken.connect(depositor).transfer(flowFinance.address, DEPOSIT_AMOUNT);

      const agentBalanceBefore = await depositSuperToken.balanceOf(ffAgent.address);

      await flowFinance.deposit(depositSuperToken.address, DEPOSIT_AMOUNT, false);

      const ffBalanceAfter = await depositSuperToken.balanceOf(flowFinance.address);
      const agentBalanceAfter = await depositSuperToken.balanceOf(ffAgent.address);

      expect(ffBalanceAfter).to.equal(0);
      expect(agentBalanceAfter.sub(agentBalanceBefore)).to.equal(DEPOSIT_AMOUNT);
    });

    it('should revert when trying to deposit zero amount', async () => {
      await expect(ffDepositor.deposit(depositSuperToken.address, 0, true)).to.be.revertedWith(
        'FLOW_FINANCE_DEPOSIT_AMOUNT_ZERO'
      );
    });

    it('should revert when trying to deposit an invalid supertoken', async () => {
      await expect(ffDepositor.deposit(fakeToken.address, DEPOSIT_AMOUNT, true)).to.be.revertedWith(
        'FLOW_FINANCE_INVALID_SUPERTOKEN'
      );
    });
  });

  describe('createFlow(address _token,address _receiver,int96 _flowRate)', () => {
    const flowRate = computeFlowRate(1000); // 1000 tokens/month

    it('should emit a valid FlowUpdated event when creating a new flow', async () => {
      expect(
        await flowFinance.createFlow(superToken.address, receiver.address, flowRate),
        'Invalid event'
      )
        .to.emit(cfav1, 'FlowUpdated')
        .withArgs(
          superToken.address,
          ffAgent.address,
          receiver.address,
          flowRate,
          flowRate.mul(-1),
          flowRate,
          '0x'
        );
    });

    it('should create a new flow correctly', async () => {
      const tx = await flowFinance.createFlow(superToken.address, receiver.address, flowRate);
      const block = await root.provider.getBlock(tx.blockNumber);

      const flow = await cfav1.getFlow(superToken.address, ffAgent.address, receiver.address);

      checkFlow(flow, [block.timestamp, flowRate, BigNumber.from('138888888891591360512'), 0]);
    });

    it('should revert when trying to create a flow without having the MANAGE_STREAMS_ROLE', async () => {
      await expect(
        flowFinance
          .connect(permissionlessAccount)
          .createFlow(superToken.address, receiver.address, flowRate)
      ).to.be.revertedWith('APP_AUTH_FAILED');
    });

    it('should revert when trying to create flow using a non-contract supertoken', async () => {
      await expect(
        flowFinance.createFlow(nonContractAccount.address, receiver.address, flowRate)
      ).to.be.revertedWith('FLOW_FINANCE_SUPERTOKEN_NOT_CONTRACT');
    });

    it('should revert when trying to create flow using an invalid supertoken', async () => {
      await expect(
        flowFinance.createFlow(fakeToken.address, receiver.address, flowRate)
      ).to.be.revertedWith('FLOW_FINANCE_INVALID_SUPERTOKEN');
    });
  });

  describe('updateFlow(ISuperToken _token,address _receiver,int96 _flowRate)', () => {
    const oldFlowRate = computeFlowRate(1000);
    const newFlowRate = computeFlowRate(2500);

    beforeEach(async () =>
      flowFinance.createFlow(superToken.address, receiver.address, oldFlowRate)
    );

    it('should emit a correct FlowUpdated event', async () => {
      expect(await flowFinance.updateFlow(superToken.address, receiver.address, newFlowRate))
        .to.emit(cfav1, 'FlowUpdated')
        .withArgs(
          superToken.address,
          ffAgent.address,
          receiver.address,
          newFlowRate,
          newFlowRate.mul(-1),
          newFlowRate,
          '0x'
        );
    });

    it('should update a flow correctly', async () => {
      const tx = await flowFinance.updateFlow(superToken.address, receiver.address, newFlowRate);
      const block = await root.provider.getBlock(tx.blockNumber);

      const flow = await cfav1.getFlow(superToken.address, ffAgent.address, receiver.address);

      checkFlow(flow, [block.timestamp, newFlowRate, BigNumber.from('34722222226119065600'), 0]);
    });

    it('should revert when trying to create a flow without having the MANAGE_STREAMS_ROLE', async () => {
      await expect(
        flowFinance
          .connect(permissionlessAccount)
          .updateFlow(superToken.address, receiver.address, newFlowRate)
      ).to.be.revertedWith('APP_AUTH_FAILED');
    });

    it('should revert when trying to create flow using a non-contract supertoken', async () => {
      await expect(
        flowFinance.updateFlow(nonContractAccount.address, receiver.address, newFlowRate)
      ).to.be.revertedWith('FLOW_FINANCE_SUPERTOKEN_NOT_CONTRACT');
    });

    it('should revert when trying to create flow using an invalid supertoken', async () => {
      await expect(
        flowFinance.updateFlow(fakeToken.address, receiver.address, newFlowRate)
      ).to.be.revertedWith('FLOW_FINANCE_INVALID_SUPERTOKEN');
    });
  });

  describe('deleteFlow(ISuperToken _token,address _receiver)', () => {
    beforeEach(async () =>
      flowFinance.createFlow(superToken.address, receiver.address, computeFlowRate(1000))
    );

    it('should emit a correct FlowUpdated event', async () => {
      expect(await flowFinance.deleteFlow(superToken.address, receiver.address))
        .to.emit(cfav1, 'FlowUpdated')
        .withArgs(superToken.address, ffAgent.address, receiver.address, 0, 0, 0, '0x');
    });

    it('should delete a flow correctly', async () => {
      await flowFinance.deleteFlow(superToken.address, receiver.address);

      const flow = await cfav1.getFlow(superToken.address, ffAgent.address, receiver.address);

      checkFlow(flow, [0, 0, 0, 0]);
    });

    it('should revert when trying to delete a flow without having the MANAGE_STREAMS_ROLE', async () => {
      await expect(
        flowFinance.connect(permissionlessAccount).deleteFlow(superToken.address, receiver.address)
      ).to.be.revertedWith('APP_AUTH_FAILED');
    });

    it('should revert when trying to delete a flow of a non-contract supertoken', async () => {
      await expect(
        flowFinance.deleteFlow(nonContractAccount.address, receiver.address)
      ).to.be.revertedWith('FLOW_FINANCE_SUPERTOKEN_NOT_CONTRACT');
    });

    it('should revert when trying to delete a flow of an invalid supertoken', async () => {
      await expect(flowFinance.deleteFlow(fakeToken.address, receiver.address)).to.be.revertedWith(
        'FLOW_FINANCE_INVALID_SUPERTOKEN'
      );
    });
  });
});
