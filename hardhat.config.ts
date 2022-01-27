import '@1hive/hardhat-aragon';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@tenderly/hardhat-tenderly';
import '@typechain/hardhat';
import 'dotenv/config';
import 'hardhat-deploy';
import 'hardhat-gas-reporter';
import { HardhatNetworkForkingConfig, HardhatUserConfig } from 'hardhat/types';
import { accounts, node_url } from './utils/network';

const forkConfig: { chainId?: number; forking?: HardhatNetworkForkingConfig } = {
  ...(process.env.HARDHAT_FORK_ID && { chainId: parseInt(process.env.HARDHAT_FORK_ID) }),
  forking: process.env.HARDHAT_FORK
    ? {
        url: process.env.HARDHAT_FORK,
        blockNumber: process.env.HARDHAT_FORK_BLOCK_NUMBER
          ? parseInt(process.env.HARDHAT_FORK_BLOCK_NUMBER)
          : undefined,
        enabled: true,
      }
    : undefined,
};

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.4.24',
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          },
        },
      },
      {
        version: '0.7.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          },
        },
      },
    ],
  },
  aragon: {
    appSrcPath: 'app/',
    appEnsName: 'superfluid.open.aragonpm.eth',
    appContractName: 'Superfluid',
    appRoles: [
      {
        id: 'MANAGE_STREAMS_ROLE',
        name: 'Manage payment flow streams',
        params: [],
      },
      {
        id: 'SET_AGENT_ROLE',
        name: 'Set an agent',
        params: [],
      },
    ],
    appBuildOutputPath: 'app/dist',
  },
  networks: {
    hardhat: {
      initialBaseFeePerGas: 0,
      // process.env.HARDHAT_FORK will specify the network that the fork is made from.
      // this line ensure the use of the corresponding accounts
      accounts: accounts(process.env.HARDHAT_FORK),
      ...forkConfig,
    },
    localhost: {
      url: node_url('localhost'),
      // accounts: accounts(),
      // ensRegistry: '0x98Df287B6C145399Aaa709692c8D308357bC085D',
      ...forkConfig,
    },
    mainnet: {
      url: node_url('mainnet'),
      accounts: accounts('mainnet'),
      appEnsName: 'superfluid.open.aragonpm.eth',
    },
    rinkeby: {
      url: node_url('rinkeby'),
      accounts: accounts('rinkeby'),
      ensRegistry: '0x98Df287B6C145399Aaa709692c8D308357bC085D',
      appEnsName: 'superfluid.open.aragonpm.eth',
    },
    xdai: {
      url: node_url('xdai'),
      accounts: accounts('xdai'),
      ensRegistry: '0xaafca6b0c89521752e559650206d7c925fd0e530',
      appEnsName: 'superfluid.open.aragonpm.eth',
    },
    polygon: {
      url: node_url('polygon'),
      accounts: accounts('polygon'),
      ensRegistry: '0x7EdE100965B1E870d726cD480dD41F2af1Ca0130',
    },
    mumbai: {
      url: node_url('mumbai'),
      accounts: accounts('mumbai'),
      ensRegistry: '0xB1576a9bE5EC445368740161174f3Dd1034fF8be',
    },
    arbitrum: {
      url: node_url('arbitrum'),
      accounts: accounts('arbitrum'),
      ensRegistry: '0xB1576a9bE5EC445368740161174f3Dd1034fF8be',
    },
    arbtest: {
      url: node_url('arbtest'),
      accounts: accounts('arbtest'),
      ensRegistry: '0x73ddD4B38982aB515daCf43289B41706f9A39199',
    },
    frame: {
      url: 'http://localhost:1248',
      httpHeaders: { origin: 'hardhat' },
      timeout: 0,
      gas: 0,
    },
  },
  ipfs: {
    gateway: 'https://ipfs.blossom.software/',
    pinata: {
      key: process.env.PINATA_KEY || '',
      secret: process.env.PINATA_SECRET_KEY || '',
    },
  },
  gasReporter: {
    enabled: !!process.env.REPORT_GAS,
  },
  mocha: {
    timeout: 0,
  },
  external: process.env.HARDHAT_FORK
    ? {
        deployments: {
          // process.env.HARDHAT_FORK will specify the network that the fork is made from.
          // these lines allow it to fetch the deployments from the network being forked from both for node and deploy task
          hardhat: ['deployments/' + process.env.HARDHAT_FORK],
          localhost: ['deployments/' + process.env.HARDHAT_FORK],
        },
      }
    : undefined,
  tenderly: {
    username: process.env.HARDHAT_TENDERLY_USERNAME,
    project: process.env.HARDHAT_TENDERLY_PROJECT,
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
};

export default config;
