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
  IConstantFlowAgreementV1,
  ISuperfluid,
  ISuperToken,
  Kernel,
  SuperfluidFinance
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

describe('Superfluid Finance', () => {
  let root: SignerWithAddress;
  let receiver: SignerWithAddress;
  let permissionlessAccount: SignerWithAddress;
  let nonContractAccount: SignerWithAddress;
  let depositor: SignerWithAddress;

  let dao: Kernel;
  let acl: ACL;
  let sfAgent: Agent;
  let superfluidFinance: SuperfluidFinance;

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
      superfluidFinance.address,
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

  before('Install Superfluid Finance', async () => {
    const SuperfluidFinance = await ethers.getContractFactory('SuperfluidFinance');
    const superfluidFinanceBase = await SuperfluidFinance.deploy();
    const superfluidFinanceAddress = await installNewApp(dao, appId, superfluidFinanceBase.address);
    superfluidFinance = await ethers.getContractAt(
      'SuperfluidFinance',
      superfluidFinanceAddress,
      root
    );

    const MANAGE_STREAMS_ROLE = await superfluidFinanceBase.MANAGE_STREAMS_ROLE();
    const SET_AGENT_ROLE = await superfluidFinance.SET_AGENT_ROLE();

    await acl.createPermission(
      root.address,
      superfluidFinance.address,
      MANAGE_STREAMS_ROLE,
      root.address
    );

    await acl.createPermission(
      root.address,
      superfluidFinance.address,
      SET_AGENT_ROLE,
      root.address
    );
  });

  before('Prepare initialization parameters', async () => {
    sfAgent = await setUpAgent();

    await generateSuperTokens(await impersonateAddress(sfAgent.address));

    snapshotId = await takeSnapshot();
  });

  beforeEach(async () => (snapshotId = await useSnapshot(snapshotId)));

  describe('initialize(Agent _agent,ISuperfluid _host,IConstantFlowAgreementV1 _cfa,address[] _acceptedTokens)', () => {
    it('should revert when passing an invalid agent', async () => {
      await expect(
        superfluidFinance.initialize(nonContractAccount.address, host.address, cfav1.address)
      ).to.be.revertedWith('SUPERFLUID_FINANCE_AGENT_NOT_CONTRACT');
    });

    it('should revert when passing an invalid host', async () => {
      await expect(
        superfluidFinance.initialize(sfAgent.address, nonContractAccount.address, cfav1.address)
      ).to.be.revertedWith('SUPERFLUID_FINANCE_HOST_NOT_CONTRACT');
    });

    it('should revert when passing an invalid cfa', async () => {
      await expect(
        superfluidFinance.initialize(sfAgent.address, host.address, nonContractAccount.address)
      ).to.be.revertedWith('SUPERFLUID_FINANCE_CFA_NOT_CONTRACT');
    });

    it('should initialize the app', async () => {
      await superfluidFinance.initialize(sfAgent.address, host.address, cfav1.address);

      // await tenderly.persistArtifacts([
      //   { address: superfluidFinance.address, name: 'SuperfluidFinance' },
      // ]);
      // await tenderly.verify([{ address: superfluidFinance.address, name: 'SuperfluidFinance' }]);

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
      expect(await superfluidFinance.setAgent(newAgent.address))
        .to.emit(superfluidFinance, 'NewAgentSet')
        .withArgs(newAgent.address);
    });

    it('should set a new agent correctly', async () => {
      await superfluidFinance.setAgent(newAgent.address);

      expect(await superfluidFinance.agent()).to.be.equal(newAgent.address);
    });

    it('should revert when trying to set a new agent without having the SET_AGENT_ROLE', async () => {
      await expect(
        superfluidFinance.connect(permissionlessAccount).setAgent(newAgent.address)
      ).to.be.revertedWith('APP_AUTH_FAILED');
    });

    it('should revert when trying to set a non-contract as the new agent', async () => {
      await expect(superfluidFinance.setAgent(nonContractAccount.address)).to.be.revertedWith(
        'SUPERFLUID_FINANCE_AGENT_NOT_CONTRACT'
      );
    });
  });

  describe('deposit(ISuperToken _token, uint256 _amount, bool _isExternalDeposit)', () => {
    let depositSuperToken: ISuperToken;
    let sfDepositor: SuperfluidFinance;

    const DEPOSIT_AMOUNT = toDecimals(3000);

    before(async () => {
      const superTokenAddress = deployments.superfluid.supertokens[1];
      const tokenSigner = await impersonateAddress(superTokenAddress);
      depositSuperToken = await ethers.getContractAt('ISuperToken', superTokenAddress, tokenSigner);
      sfDepositor = superfluidFinance.connect(depositor);

      await depositSuperToken.connect(depositor).approve(superfluidFinance.address, DEPOSIT_AMOUNT);
      await depositSuperToken.selfMint(depositor.address, DEPOSIT_AMOUNT, '0x');

      snapshotId = await takeSnapshot();
    });

    it('should deposit tokens correctly', async () => {
      const agentBalanceBefore = await depositSuperToken.balanceOf(sfAgent.address);

      await sfDepositor.deposit(depositSuperToken.address, DEPOSIT_AMOUNT, true);

      const agentBalanceAfter = await depositSuperToken.balanceOf(sfAgent.address);
      const depositorBalanceAfter = await depositSuperToken.balanceOf(depositor.address);

      expect(depositorBalanceAfter).to.equal(0);
      expect(agentBalanceAfter.sub(agentBalanceBefore)).to.equal(DEPOSIT_AMOUNT);
    });

    it('should deposit tokens already transfered to the app', async () => {
      await depositSuperToken
        .connect(depositor)
        .transfer(superfluidFinance.address, DEPOSIT_AMOUNT);

      const agentBalanceBefore = await depositSuperToken.balanceOf(sfAgent.address);

      await superfluidFinance.deposit(depositSuperToken.address, DEPOSIT_AMOUNT, false);

      const sfBalanceAfter = await depositSuperToken.balanceOf(superfluidFinance.address);
      const agentBalanceAfter = await depositSuperToken.balanceOf(sfAgent.address);

      expect(sfBalanceAfter).to.equal(0);
      expect(agentBalanceAfter.sub(agentBalanceBefore)).to.equal(DEPOSIT_AMOUNT);
    });

    it('should revert when trying to deposit zero amount', async () => {
      await expect(sfDepositor.deposit(depositSuperToken.address, 0, true)).to.be.revertedWith(
        'SUPERFLUID_FINANCE_DEPOSIT_AMOUNT_ZERO'
      );
    });

    it('should revert when trying to deposit an invalid supertoken', async () => {
      await expect(sfDepositor.deposit(fakeToken.address, DEPOSIT_AMOUNT, true)).to.be.revertedWith(
        'SUPERFLUID_FINANCE_INVALID_SUPERTOKEN'
      );
    });
  });

  describe('createFlow(address _token,address _receiver,int96 _flowRate)', () => {
    const flowRate = computeFlowRate(1000); // 1000 tokens/month

    it('should emit a valid FlowUpdated event when creating a new flow', async () => {
      expect(
        await superfluidFinance.createFlow(superToken.address, receiver.address, flowRate),
        'Invalid event'
      )
        .to.emit(cfav1, 'FlowUpdated')
        .withArgs(
          superToken.address,
          sfAgent.address,
          receiver.address,
          flowRate,
          flowRate.mul(-1),
          flowRate,
          '0x'
        );
    });

    it('should create a new flow correctly', async () => {
      const tx = await superfluidFinance.createFlow(superToken.address, receiver.address, flowRate);
      const block = await root.provider.getBlock(tx.blockNumber);

      const flow = await cfav1.getFlow(superToken.address, sfAgent.address, receiver.address);

      checkFlow(flow, [block.timestamp, flowRate, BigNumber.from('138888888891591360512'), 0]);
    });

    it('should revert when trying to create a flow without having the MANAGE_STREAMS_ROLE', async () => {
      await expect(
        superfluidFinance
          .connect(permissionlessAccount)
          .createFlow(superToken.address, receiver.address, flowRate)
      ).to.be.revertedWith('APP_AUTH_FAILED');
    });

    it('should revert when trying to create flow using a non-contract supertoken', async () => {
      await expect(
        superfluidFinance.createFlow(nonContractAccount.address, receiver.address, flowRate)
      ).to.be.revertedWith('SUPERFLUID_FINANCE_SUPERTOKEN_NOT_CONTRACT');
    });

    it('should revert when trying to create flow using an invalid supertoken', async () => {
      await expect(
        superfluidFinance.createFlow(fakeToken.address, receiver.address, flowRate)
      ).to.be.revertedWith('SUPERFLUID_FINANCE_INVALID_SUPERTOKEN');
    });
  });

  describe('updateFlow(ISuperToken _token,address _receiver,int96 _flowRate)', () => {
    const oldFlowRate = computeFlowRate(1000);
    const newFlowRate = computeFlowRate(2500);

    beforeEach(async () =>
      superfluidFinance.createFlow(superToken.address, receiver.address, oldFlowRate)
    );

    it('should emit a correct FlowUpdated event', async () => {
      expect(await superfluidFinance.updateFlow(superToken.address, receiver.address, newFlowRate))
        .to.emit(cfav1, 'FlowUpdated')
        .withArgs(
          superToken.address,
          sfAgent.address,
          receiver.address,
          newFlowRate,
          newFlowRate.mul(-1),
          newFlowRate,
          '0x'
        );
    });

    it('should update a flow correctly', async () => {
      const tx = await superfluidFinance.updateFlow(
        superToken.address,
        receiver.address,
        newFlowRate
      );
      const block = await root.provider.getBlock(tx.blockNumber);

      const flow = await cfav1.getFlow(superToken.address, sfAgent.address, receiver.address);

      checkFlow(flow, [block.timestamp, newFlowRate, BigNumber.from('34722222226119065600'), 0]);
    });

    it('should revert when trying to create a flow without having the MANAGE_STREAMS_ROLE', async () => {
      await expect(
        superfluidFinance
          .connect(permissionlessAccount)
          .updateFlow(superToken.address, receiver.address, newFlowRate)
      ).to.be.revertedWith('APP_AUTH_FAILED');
    });

    it('should revert when trying to create flow using a non-contract supertoken', async () => {
      await expect(
        superfluidFinance.updateFlow(nonContractAccount.address, receiver.address, newFlowRate)
      ).to.be.revertedWith('SUPERFLUID_FINANCE_SUPERTOKEN_NOT_CONTRACT');
    });

    it('should revert when trying to create flow using an invalid supertoken', async () => {
      await expect(
        superfluidFinance.updateFlow(fakeToken.address, receiver.address, newFlowRate)
      ).to.be.revertedWith('SUPERFLUID_FINANCE_INVALID_SUPERTOKEN');
    });
  });

  describe('deleteFlow(ISuperToken _token,address _receiver)', () => {
    beforeEach(async () =>
      superfluidFinance.createFlow(superToken.address, receiver.address, computeFlowRate(1000))
    );

    it('should emit a correct FlowUpdated event', async () => {
      expect(await superfluidFinance.deleteFlow(superToken.address, receiver.address))
        .to.emit(cfav1, 'FlowUpdated')
        .withArgs(superToken.address, sfAgent.address, receiver.address, 0, 0, 0, '0x');
    });

    it('should delete a flow correctly', async () => {
      await superfluidFinance.deleteFlow(superToken.address, receiver.address);

      const flow = await cfav1.getFlow(superToken.address, sfAgent.address, receiver.address);

      checkFlow(flow, [0, 0, 0, 0]);
    });

    it('should revert when trying to delete a flow without having the MANAGE_STREAMS_ROLE', async () => {
      await expect(
        superfluidFinance
          .connect(permissionlessAccount)
          .deleteFlow(superToken.address, receiver.address)
      ).to.be.revertedWith('APP_AUTH_FAILED');
    });

    it('should revert when trying to delete a flow of a non-contract supertoken', async () => {
      await expect(
        superfluidFinance.deleteFlow(nonContractAccount.address, receiver.address)
      ).to.be.revertedWith('SUPERFLUID_FINANCE_SUPERTOKEN_NOT_CONTRACT');
    });

    it('should revert when trying to delete a flow of an invalid supertoken', async () => {
      await expect(
        superfluidFinance.deleteFlow(fakeToken.address, receiver.address)
      ).to.be.revertedWith('SUPERFLUID_FINANCE_INVALID_SUPERTOKEN');
    });
  });
});
