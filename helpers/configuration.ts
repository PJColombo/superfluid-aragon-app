import hre from 'hardhat';
import { Deployments, EthereumNetworkNames, NetworksDeployments } from './types';

const getNetworkNameById = (chainId: number): string => {
  const { Rinkeby, Goerli, Xdai, Polygon } = EthereumNetworkNames;
  switch (chainId) {
    case 4:
      return Rinkeby;
    case 5:
      return Goerli;
    case 100:
      return Xdai;
    case 137:
      return Polygon;
    default:
      return Xdai;
  }
};
const Config: NetworksDeployments = {
  [EthereumNetworkNames.Xdai]: {
    aragon: {
      daoFactory: '0x4037f97fcc94287257e50bd14c7da9cb4df18250',
      agentBase: '0xa6ad366bfd2f43615bbec56f50cf606036fc11fe',
    },
    superfluidProtocol: {
      cfav1: '0xEbdA4ceF883A7B12c4E669Ebc58927FBa8447C7D',
      host: '0x2dFe937cD98Ab92e59cF3139138f18c823a4efE7',
      supertokens: [
        '0x59988e47A3503AaFaA0368b9deF095c818Fdca01', // xDAIx
      ],
      tokens: [''], // wxDAI
    },
  },
  [EthereumNetworkNames.Rinkeby]: {
    aragon: {
      daoFactory: '0xad4d106b43b480faa3ef7f98464ffc27fc1faa96',
      agentBase: '0xe10c2dE02F1c64485B680FC561E8E9c680691FAA',
    },
    superfluidProtocol: {
      cfav1: '0xF4C5310E51F6079F601a5fb7120bC72a70b96e2A',
      host: '0xeD5B5b32110c3Ded02a07c8b8e97513FAfb883B6',
      supertokens: [
        '0x745861AeD1EEe363b4AaA5F1994Be40b1e05Ff90', // fDAIx
        '0x0F1D7C55A2B133E000eA10EeC03c774e0d6796e8', // fUSDCx
      ],
      tokens: [
        '0x15F0Ca26781C3852f8166eD2ebce5D18265cceb7', // fDAI,
        '0xbe49ac1EadAc65dccf204D4Df81d650B50122aB2', // fUSDC
      ],
    },
  },
};

export const getDeployments = (): Deployments => {
  return Config[getNetworkNameById(hre.network.config.chainId)];
};

export default NetworksDeployments;
