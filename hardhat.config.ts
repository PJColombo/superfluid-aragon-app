import '@1hive/hardhat-aragon';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@tenderly/hardhat-tenderly';
import '@typechain/hardhat';
import 'dotenv/config';
import 'hardhat-deploy';
import { HardhatUserConfig } from 'hardhat/types';

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
        name: 'Manage payment streams',
        params: [],
      },
      {
        id: 'SET_AGENT_ROLE',
        name: 'Set an agent',
        params: [],
      },
      {
        id: 'MANAGE_SUPERTOKENS_ROLE',
        name: 'Manage SuperTokens amount',
        params: [],
      },
    ],
    appBuildOutputPath: 'dist',
  },
  networks: {
    hardhat: {
      initialBaseFeePerGas: 0,
      forking: process.env.HARDHAT_FORK
        ? {
            url: process.env.HARDHAT_FORK,
            blockNumber: process.env.HARDHAT_FORK_BLOCK_NUMBER
              ? parseInt(process.env.HARDHAT_FORK_BLOCK_NUMBER)
              : undefined,
            enabled: true,
          }
        : undefined,
    },
    goerli: {
      url: 'https://rpc.ankr.com/eth_goerli',
      ensRegistry: '0x8cF5A255ED61F403837F040B8D9f052857469273',
      appEnsName: 'superfluid.open.aragonpm.eth',
    },
    gnosis: {
      url: 'https://gnosis.publicnode.com',
      ensRegistry: '0xaafca6b0c89521752e559650206d7c925fd0e530',
      appEnsName: 'superfluid.open.aragonpm.eth',
    },
    polygon: {
      url: 'https://polygon-rpc.com',
      appEnsName: 'superfluid.open.aragonpm.eth',
      // Aragon ENS registry
      // ensRegistry: '0x3c70a0190d09f34519e6e218364451add21b7d4b',
      // 1Hive ENS registry
      // ensRegistry: '0x7EdE100965B1E870d726cD480dD41F2af1Ca0130',
      // 1Hive ENS registry being used on the client:
      ensRegistry: '0x4E065c622d584Fbe5D9078C3081840155FA69581',
    },
    frame: {
      url: 'http://localhost:1248',
      httpHeaders: { origin: 'hardhat' },
      timeout: 0,
      gas: 0,
    },
  },
  ipfs: {
    gateway: 'http://localhost:8080',
    pinata: {
      key: process.env.PINATA_KEY || '',
      secret: process.env.PINATA_SECRET_KEY || '',
    },
  },
  mocha: {
    timeout: 0,
  },
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
