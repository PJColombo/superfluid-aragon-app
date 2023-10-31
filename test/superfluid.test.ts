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
  Superfluid,
  ISuperfluid,
  ISuperToken,
  Kernel,
} from '../typechain';
import { installNewApp, newDao, toDecimals } from './helpers';
import { computeFlowRate } from './helpers/superfluid';

const { utils: ethersUtils } = ethers;
const abiCoder = ethersUtils.defaultAbiCoder;

const { aragon } = hre.config;
const deployments = getDeployments();

type Flow = [BigNumber, BigNumber, BigNumber, BigNumber] & {
  timestamp: BigNumber;
  flowRate: BigNumber;
  deposit: BigNumber;
  owedDeposit: BigNumber;
};

describe('Superfluid', () => {
  let root: SignerWithAddress;
  let receiver: SignerWithAddress;
  let permissionlessAccount: SignerWithAddress;
  let nonContractAccount: SignerWithAddress;
  let transferrer: SignerWithAddress;

  let dao: Kernel;
  let acl: ACL;
  let superfluidApp: Superfluid;
  let ffAgent: Agent;
  let ffAgentSigner: SignerWithAddress;

  let host: ISuperfluid;
  let cfav1: IConstantFlowAgreementV1;
  let superToken: ISuperToken;
  let fakeToken: FakeToken;

  const appId = ethersUtils.namehash(aragon.appEnsName);

  const TOKEN_AMOUNT = toDecimals(5000);

  let snapshotId: string;

  const generateSuperTokens = async (recipientSigner: SignerWithAddress, amount: BigNumber) => {
    await fakeToken.mint(recipientSigner.address, amount);
    await fakeToken.connect(recipientSigner).approve(superToken.address, amount);

    await superToken.connect(recipientSigner).upgrade(amount);
  };

  const mintFakeTokens = async (recipientSigner: SignerWithAddress, amount: BigNumber) => {
    await fakeToken.mint(recipientSigner.address, amount);
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
      superfluidApp.address,
      agent.address,
      await agent.SAFE_EXECUTE_ROLE(),
      root.address
    );
    await acl.createPermission(
      superfluidApp.address,
      agent.address,
      await agent.TRANSFER_ROLE(),
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

  before('Prepare Superfluid protocol contracts', async () => {
    [root, receiver, permissionlessAccount, nonContractAccount, transferrer] =
      await ethers.getSigners();

    const { superfluidProtocol } = deployments;

    host = await ethers.getContractAt('ISuperfluid', superfluidProtocol.host, root);
    cfav1 = await ethers.getContractAt('IConstantFlowAgreementV1', superfluidProtocol.cfav1, root);
    superToken = await ethers.getContractAt('ISuperToken', superfluidProtocol.supertokens[0], root);
    fakeToken = await ethers.getContractAt('FakeToken', superfluidProtocol.tokens[0], root);
  });

  before('Create DAO', async () => {
    const daoFactory = await ethers.getContractAt(
      'DAOFactory',
      deployments.aragon.daoFactory,
      root
    );

    [dao, acl] = await newDao(root, daoFactory);
  });

  before('Install Superfluid app', async () => {
    const Superfluid = await ethers.getContractFactory('Superfluid');
    const SuperfluidBase = await Superfluid.deploy();
    const superfluidAppAddress = await installNewApp(dao, appId, SuperfluidBase.address);
    superfluidApp = await ethers.getContractAt('Superfluid', superfluidAppAddress, root);

    const MANAGE_STREAMS_ROLE = await SuperfluidBase.MANAGE_STREAMS_ROLE();
    const SET_AGENT_ROLE = await superfluidApp.SET_AGENT_ROLE();
    const MANAGE_SUPERTOKENS_ROLE = await SuperfluidBase.MANAGE_SUPERTOKENS_ROLE();

    await acl.createPermission(
      root.address,
      superfluidApp.address,
      MANAGE_STREAMS_ROLE,
      root.address
    );
    await acl.grantPermission(transferrer.address, superfluidApp.address, MANAGE_STREAMS_ROLE);

    await acl.createPermission(root.address, superfluidApp.address, SET_AGENT_ROLE, root.address);

    await acl.createPermission(root.address, superfluidApp.address, MANAGE_SUPERTOKENS_ROLE, root.address);
  });

  before('Prepare agent app', async () => {
    ffAgent = await setUpAgent();
    ffAgentSigner = await impersonateAddress(ffAgent.address);

    await generateSuperTokens(ffAgentSigner, TOKEN_AMOUNT);

    snapshotId = await takeSnapshot();
  });

  beforeEach(async () => (snapshotId = await useSnapshot(snapshotId)));

  describe('when initializing the Superfluid app', () => {
    it('should revert when passing an invalid agent', async () => {
      await expect(
        superfluidApp.initialize(nonContractAccount.address, host.address, cfav1.address)
      ).to.be.revertedWith('SUPERFLUID_AGENT_NOT_CONTRACT');
    });

    it('should revert when passing an invalid host', async () => {
      await expect(
        superfluidApp.initialize(ffAgent.address, nonContractAccount.address, cfav1.address)
      ).to.be.revertedWith('SUPERFLUID_HOST_NOT_CONTRACT');
    });

    it('should revert when passing an invalid cfa', async () => {
      await expect(
        superfluidApp.initialize(ffAgent.address, host.address, nonContractAccount.address)
      ).to.be.revertedWith('SUPERFLUID_CFA_NOT_CONTRACT');
    });

    it('should initialize the app', async () => {
      await superfluidApp.initialize(ffAgent.address, host.address, cfav1.address);

      // await tenderly.persistArtifacts([
      //   { address: superfluidApp.address, name: 'Superfluid' },
      // ]);
      // await tenderly.verify([{ address: superfluidApp.address, name: 'Superfluid' }]);

      snapshotId = await takeSnapshot();
    });
  });

  describe('when setting a new agent', () => {
    let newAgent: Agent;

    before(async () => {
      newAgent = await setUpAgent();

      snapshotId = await takeSnapshot();
    });

    it('should emit a correct NewAgentSet event', async () => {
      expect(await superfluidApp.setAgent(newAgent.address))
        .to.emit(superfluidApp, 'NewAgentSet')
        .withArgs(newAgent.address);
    });

    it('should set a new agent correctly', async () => {
      await superfluidApp.setAgent(newAgent.address);

      expect(await superfluidApp.agent()).to.be.equal(newAgent.address);
    });

    it('should revert when trying to set a new agent without having the SET_AGENT_ROLE', async () => {
      await expect(
        superfluidApp.connect(permissionlessAccount).setAgent(newAgent.address)
      ).to.be.revertedWith('APP_AUTH_FAILED');
    });

    it('should revert when trying to set a non-contract as the new agent', async () => {
      await expect(superfluidApp.setAgent(nonContractAccount.address)).to.be.revertedWith(
        'SUPERFLUID_AGENT_NOT_CONTRACT'
      );
    });
  });

  describe("when making app's discrete token transfer operations", () => {
    let transferredSuperToken: ISuperToken;
    let ffTransferrer: Superfluid;

    const TRANSFERRED_AMOUNT = toDecimals(3000);

    before(async () => {
      const superTokenAddress = deployments.superfluidProtocol.supertokens[1];
      const tokenSigner = await impersonateAddress(superTokenAddress);
      transferredSuperToken = await ethers.getContractAt(
        'ISuperToken',
        superTokenAddress,
        tokenSigner
      );
      ffTransferrer = superfluidApp.connect(transferrer);

      await transferredSuperToken
        .connect(transferrer)
        .approve(superfluidApp.address, TRANSFERRED_AMOUNT);
      await transferredSuperToken.selfMint(transferrer.address, TRANSFERRED_AMOUNT, '0x');

      snapshotId = await takeSnapshot();
    });

    describe('when depositing tokens into the app', () => {
      it('should deposit tokens correctly', async () => {
        const agentBalanceBefore = await transferredSuperToken.balanceOf(ffAgent.address);

        await ffTransferrer.deposit(transferredSuperToken.address, TRANSFERRED_AMOUNT, true);

        const agentBalanceAfter = await transferredSuperToken.balanceOf(ffAgent.address);
        const depositorBalanceAfter = await transferredSuperToken.balanceOf(transferrer.address);

        expect(depositorBalanceAfter).to.equal(0);
        expect(agentBalanceAfter.sub(agentBalanceBefore)).to.equal(TRANSFERRED_AMOUNT);
      });

      it('should deposit tokens already transfered to the app', async () => {
        await transferredSuperToken
          .connect(transferrer)
          .transfer(superfluidApp.address, TRANSFERRED_AMOUNT);

        const agentBalanceBefore = await transferredSuperToken.balanceOf(ffAgent.address);

        await superfluidApp.deposit(transferredSuperToken.address, TRANSFERRED_AMOUNT, false);

        const ffBalanceAfter = await transferredSuperToken.balanceOf(superfluidApp.address);
        const agentBalanceAfter = await transferredSuperToken.balanceOf(ffAgent.address);

        expect(ffBalanceAfter).to.equal(0);
        expect(agentBalanceAfter.sub(agentBalanceBefore)).to.equal(TRANSFERRED_AMOUNT);
      });

      it('should revert when trying to deposit zero Super Tokens', async () => {
        await expect(
          ffTransferrer.deposit(transferredSuperToken.address, 0, true)
        ).to.be.revertedWith('SUPERFLUID_DEPOSIT_AMOUNT_ZERO');
      });

      it('should revert when trying to deposit an invalid Super Token', async () => {
        await expect(
          ffTransferrer.deposit(fakeToken.address, TRANSFERRED_AMOUNT, true)
        ).to.be.revertedWith('SUPERFLUID_INVALID_SUPERTOKEN');
      });
    });

    describe('when withdrawing tokens out of the app', () => {
      beforeEach(async () => {
        await ffTransferrer.deposit(transferredSuperToken.address, TRANSFERRED_AMOUNT, true);
      });

      it('should withdraw tokens correctly', async () => {
        const withdrawerBalanceBefore = await transferredSuperToken.balanceOf(transferrer.address);

        await superfluidApp.withdraw(
          transferredSuperToken.address,
          transferrer.address,
          TRANSFERRED_AMOUNT
        );

        const agentBalanceAfter = await transferredSuperToken.balanceOf(ffAgent.address);
        const withdrawerBalanceAfter = await transferredSuperToken.balanceOf(transferrer.address);

        expect(agentBalanceAfter).to.equal(0);
        expect(withdrawerBalanceAfter.sub(withdrawerBalanceBefore)).to.equal(TRANSFERRED_AMOUNT);
      });

      it('should revert when trying to withdraw Super Tokens without having the MANAGE_STREAMS_ROLE', async () => {
        await expect(
          superfluidApp
            .connect(permissionlessAccount)
            .withdraw(transferredSuperToken.address, transferrer.address, TRANSFERRED_AMOUNT)
        ).to.be.revertedWith('APP_AUTH_FAILED');
      });

      it('should revert when trying to withdraw zero Super Tokens', async () => {
        await expect(
          ffTransferrer.withdraw(transferredSuperToken.address, transferrer.address, 0)
        ).to.be.revertedWith('SUPERFLUID_WITHDRAW_AMOUNT_ZERO');
      });

      it('should revert when trying to withdraw an invalid Super Token', async () => {
        await expect(
          ffTransferrer.withdraw(fakeToken.address, transferrer.address, TRANSFERRED_AMOUNT)
        ).to.be.revertedWith('SUPERFLUID_INVALID_SUPERTOKEN');
      });
    });

    describe('when upgrading Super Token amount', () => {
      const amountToUpgrade = toDecimals(200);

      beforeEach(async () => {
        await mintFakeTokens(ffAgentSigner, amountToUpgrade);
      });

      it('should upgrade Token amount on agent correctly', async () => {
        const agentFakeTokenBalanceBefore = await ffAgent.balance(fakeToken.address);

        await superfluidApp.upgrade(superToken.address, amountToUpgrade);

        const agentFakeTokenBalanceAfter = await ffAgent.balance(fakeToken.address);

        expect(agentFakeTokenBalanceBefore.sub(amountToUpgrade)).equal(agentFakeTokenBalanceAfter);
      });

      it('should upgrade Super Token amount on agent correctly', async () => {
        const agentSuperTokenBalanceBefore = await ffAgent.balance(superToken.address);

        await superfluidApp.upgrade(superToken.address, amountToUpgrade);

        const agentSuperTokenBalanceAfter = await ffAgent.balance(superToken.address);

        expect(agentSuperTokenBalanceBefore.add(amountToUpgrade)).equal(
          agentSuperTokenBalanceAfter
        );
      });

      it('should revert when trying to upgrade Super Token without having MANAGE_SUPERTOKENS_ROLE', async () => {
        await expect(
          superfluidApp.connect(permissionlessAccount).upgrade(superToken.address, 0)
        ).to.be.revertedWith('APP_AUTH_FAILED');
      });

      it('should revert if provided token is not SuperToken', async () => {
        await expect(superfluidApp.upgrade(fakeToken.address, amountToUpgrade)).to.be.revertedWith(
          'SUPERFLUID_INVALID_SUPERTOKEN'
        );
      });

      it('should revert when trying to upgrade Super Token with amount less then 1', async () => {
        await expect(superfluidApp.upgrade(superToken.address, 0)).to.be.revertedWith(
          'SUPERFLUID_UPGRADE_AMOUNT_ZERO'
        );
      });
    });

    describe('when downgrading Super Token amount', () => {
      const amountToDowngrade = toDecimals(200);

      it('should downgrade Token amount on agent correctly', async () => {
        const agentFakeTokenBalanceBefore = await ffAgent.balance(fakeToken.address);

        await superfluidApp.downgrade(superToken.address, amountToDowngrade);

        const agentFakeTokenBalanceAfter = await ffAgent.balance(fakeToken.address);

        expect(agentFakeTokenBalanceBefore.add(amountToDowngrade)).equal(
          agentFakeTokenBalanceAfter
        );
      });

      it('should downgrade Super Token amount on agent correctly', async () => {
        const agentSuperTokenBalanceBefore = await ffAgent.balance(superToken.address);

        await superfluidApp.downgrade(superToken.address, amountToDowngrade);

        const agentSuperTokenBalanceAfter = await ffAgent.balance(superToken.address);

        expect(agentSuperTokenBalanceBefore.sub(amountToDowngrade)).equal(
          agentSuperTokenBalanceAfter
        );
      });

      it('should revert when trying to downgrade Super Token without having MANAGE_SUPERTOKENS_ROLE', async () => {
        await expect(
          superfluidApp.connect(permissionlessAccount).downgrade(superToken.address, 0)
        ).to.be.revertedWith('APP_AUTH_FAILED');
      });

      it('should revert if provided token is not SuperToken', async () => {
        await expect(
          superfluidApp.downgrade(fakeToken.address, amountToDowngrade)
        ).to.be.revertedWith('SUPERFLUID_INVALID_SUPERTOKEN');
      });

      it('should revert when trying to downgrade Super Token with amount less then 1', async () => {
        await expect(superfluidApp.downgrade(superToken.address, 0)).to.be.revertedWith(
          'SUPERFLUID_DOWNGRADE_AMOUNT_ZERO'
        );
      });
    });
  });

  describe('when creating a new flow', () => {
    const flowRate = computeFlowRate(1000); // 1000 tokens/month

    it('should emit a valid FlowUpdated event when creating a new flow', async () => {
      const description = abiCoder.encode(['string'], ['Test description']);

      expect(
        await superfluidApp.createFlow(superToken.address, receiver.address, flowRate, description),
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
          description
        );
    });

    it('should create a new flow correctly', async () => {
      const tx = await superfluidApp.createFlow(
        superToken.address,
        receiver.address,
        flowRate,
        '0x'
      );
      const block = await root.provider.getBlock(tx.blockNumber);

      const flow = await cfav1.getFlow(superToken.address, ffAgent.address, receiver.address);

      checkFlow(flow, [block.timestamp, flowRate, BigNumber.from('138888888891591360512'), 0]);
    });

    it('should revert when trying to create a flow without having the MANAGE_STREAMS_ROLE', async () => {
      await expect(
        superfluidApp
          .connect(permissionlessAccount)
          .createFlow(superToken.address, receiver.address, flowRate, '0x')
      ).to.be.revertedWith('APP_AUTH_FAILED');
    });

    it('should revert when trying to create flow using a non-contract Super Token', async () => {
      await expect(
        superfluidApp.createFlow(nonContractAccount.address, receiver.address, flowRate, '0x')
      ).to.be.revertedWith('SUPERFLUID_SUPERTOKEN_NOT_CONTRACT');
    });

    it('should revert when trying to create flow using an invalid Super Token', async () => {
      await expect(
        superfluidApp.createFlow(fakeToken.address, receiver.address, flowRate, '0x')
      ).to.be.revertedWith('SUPERFLUID_INVALID_SUPERTOKEN');
    });
  });

  describe('when updating a flow', () => {
    const oldFlowRate = computeFlowRate(1000);
    const newFlowRate = computeFlowRate(2500);

    beforeEach(async () =>
      superfluidApp.createFlow(superToken.address, receiver.address, oldFlowRate, '0x')
    );

    it('should emit a correct FlowUpdated event', async () => {
      const description = abiCoder.encode(['string'], ['New test description']);

      expect(
        await superfluidApp.updateFlow(
          superToken.address,
          receiver.address,
          newFlowRate,
          description
        )
      )
        .to.emit(cfav1, 'FlowUpdated')
        .withArgs(
          superToken.address,
          ffAgent.address,
          receiver.address,
          newFlowRate,
          newFlowRate.mul(-1),
          newFlowRate,
          description
        );
    });

    it('should update a flow correctly', async () => {
      const tx = await superfluidApp.updateFlow(
        superToken.address,
        receiver.address,
        newFlowRate,
        '0x'
      );
      const block = await root.provider.getBlock(tx.blockNumber);

      const flow = await cfav1.getFlow(superToken.address, ffAgent.address, receiver.address);

      checkFlow(flow, [block.timestamp, newFlowRate, BigNumber.from('34722222226119065600'), 0]);
    });

    it('should revert when trying to create a flow without having the MANAGE_STREAMS_ROLE', async () => {
      await expect(
        superfluidApp
          .connect(permissionlessAccount)
          .updateFlow(superToken.address, receiver.address, newFlowRate, '0x')
      ).to.be.revertedWith('APP_AUTH_FAILED');
    });

    it('should revert when trying to create flow using a non-contract Super Token', async () => {
      await expect(
        superfluidApp.updateFlow(nonContractAccount.address, receiver.address, newFlowRate, '0x')
      ).to.be.revertedWith('SUPERFLUID_SUPERTOKEN_NOT_CONTRACT');
    });

    it('should revert when trying to create flow using an invalid Super Token', async () => {
      await expect(
        superfluidApp.updateFlow(fakeToken.address, receiver.address, newFlowRate, '0x')
      ).to.be.revertedWith('SUPERFLUID_INVALID_SUPERTOKEN');
    });
  });

  describe('when deleting a flow', () => {
    beforeEach(async () =>
      superfluidApp.createFlow(superToken.address, receiver.address, computeFlowRate(1000), '0x')
    );

    it('should delete a flow correctly', async () => {
      await superfluidApp.deleteFlow(superToken.address, receiver.address);

      const flow = await cfav1.getFlow(superToken.address, ffAgent.address, receiver.address);

      checkFlow(flow, [0, 0, 0, 0]);
    });

    it('should delete a own flow correctly', async () => {
      await superfluidApp.connect(receiver).deleteOwnFlow(superToken.address);

      const flow = await cfav1.getFlow(superToken.address, ffAgent.address, receiver.address);

      checkFlow(flow, [0, 0, 0, 0]);
    });

    it('should emit a correct FlowUpdated event', async () => {
      expect(await superfluidApp.deleteFlow(superToken.address, receiver.address))
        .to.emit(cfav1, 'FlowUpdated')
        .withArgs(superToken.address, ffAgent.address, receiver.address, 0, 0, 0, '0x');
    });

    it('should emit a correct FlowUpdated event when deleting a own flow', async () => {
      expect(await superfluidApp.connect(receiver).deleteOwnFlow(superToken.address))
        .to.emit(cfav1, 'FlowUpdated')
        .withArgs(superToken.address, ffAgent.address, receiver.address, 0, 0, 0, '0x');
    });

    it('should revert when trying to delete a flow without having the MANAGE_STREAMS_ROLE', async () => {
      await expect(
        superfluidApp
          .connect(permissionlessAccount)
          .deleteFlow(superToken.address, receiver.address)
      ).to.be.revertedWith('APP_AUTH_FAILED');
    });

    it('should revert when trying to delete a own flow one is not part of', async () => {
      await expect(
        superfluidApp.connect(permissionlessAccount).deleteOwnFlow(superToken.address)
      ).to.be.revertedWith('SUPERFLUID_SENDER_CAN_NOT_DELETE_FLOW');
    });

    it('should revert when trying to delete a flow of a non-contract Super Token', async () => {
      await expect(
        superfluidApp.deleteFlow(nonContractAccount.address, receiver.address)
      ).to.be.revertedWith('SUPERFLUID_SUPERTOKEN_NOT_CONTRACT');
    });

    it('should revert when trying to delete a flow of an invalid Super Token', async () => {
      await expect(
        superfluidApp.deleteFlow(fakeToken.address, receiver.address)
      ).to.be.revertedWith('SUPERFLUID_INVALID_SUPERTOKEN');
    });
  });
});
