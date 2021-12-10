import { Signer } from '@ethersproject/abstract-signer';
import { BigNumber } from '@ethersproject/bignumber';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { getDeployments } from '../helpers/configuration';
import { impersonateAddress, restoreSnapshot, takeSnapshot } from '../helpers/rpc';
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

const { utils: ethersUtils } = ethers;

const { aragon } = hre.config;
const deployments = getDeployments();

describe('Superfluid Finance', () => {
  let root: SignerWithAddress;
  let receiver: SignerWithAddress;
  let permissionlessAccount: SignerWithAddress;
  let nonContractAccount: SignerWithAddress;

  let dao: Kernel;
  let acl: ACL;
  let superfluidFinanceAgent: Agent;
  let superfluidFinance: SuperfluidFinance;

  let host: ISuperfluid;
  let cfav1: IConstantFlowAgreementV1;
  let superToken: ISuperToken;
  let fakeToken: FakeToken;

  const appId = ethersUtils.namehash(aragon.appEnsName);

  const TOKEN_AMOUNT = toDecimals(5000);

  let snapshotId: string;

  const useSnapshot = async (): Promise<void> => {
    await restoreSnapshot(snapshotId);

    snapshotId = await takeSnapshot();
  };

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

    [root, receiver, permissionlessAccount, nonContractAccount] = await ethers.getSigners();
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
    superfluidFinanceAgent = await setUpAgent();

    await generateSuperTokens(await impersonateAddress(superfluidFinanceAgent.address));

    snapshotId = await takeSnapshot();
  });

  beforeEach(async () => await useSnapshot());

  describe('initialize(Agent _agent,ISuperfluid _host,IConstantFlowAgreementV1 _cfa,address[] _acceptedTokens)', () => {
    it('should revert when passing an invalid agent', async () => {
      await expect(
        superfluidFinance.initialize(nonContractAccount.address, host.address, cfav1.address)
      ).to.be.revertedWith('SUPERFLUID_FINANCE_AGENT_NOT_CONTRACT');
    });

    it('should revert when passing an invalid host', async () => {
      await expect(
        superfluidFinance.initialize(
          superfluidFinanceAgent.address,
          nonContractAccount.address,
          cfav1.address
        )
      ).to.be.revertedWith('SUPERFLUID_FINANCE_HOST_NOT_CONTRACT');
    });

    it('should revert when passing an invalid cfa', async () => {
      await expect(
        superfluidFinance.initialize(
          superfluidFinanceAgent.address,
          host.address,
          nonContractAccount.address
        )
      ).to.be.revertedWith('SUPERFLUID_FINANCE_CFA_NOT_CONTRACT');
    });

    it('should initialize the app', async () => {
      await superfluidFinance.initialize(
        superfluidFinanceAgent.address,
        host.address,
        cfav1.address
      );

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

  describe('createFlow(address _token,address _receiver,int96 _flowRate)', () => {
    const flowRate = BigNumber.from('3858024691358020'); // 1000 tokens/month

    it('should emit a valid FlowUpdated event when creating a new flow', async () => {
      expect(
        await superfluidFinance.createFlow(superToken.address, receiver.address, flowRate),
        'Invalid event'
      )
        .to.emit(cfav1, 'FlowUpdated')
        .withArgs(
          superToken.address,
          superfluidFinanceAgent.address,
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

      const flow = await cfav1.getFlow(
        superToken.address,
        superfluidFinanceAgent.address,
        receiver.address
      );

      expect(flow.timestamp, 'Timestamp mismatch').to.equal(block.timestamp);
      expect(flow.flowRate, 'Flow rate mismatch').to.equal(flowRate);
      expect(flow.deposit, 'Deposit mismatch').to.equal(BigNumber.from('13888888890447626240'));
      expect(flow.owedDeposit, 'Owed deposit mismatch').to.equal(0);
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
  });
});
