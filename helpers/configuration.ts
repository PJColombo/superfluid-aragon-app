import hre from 'hardhat';
import { Deployments, EthereumNetworkNames, NetworksDeployments } from './types';

const getNetworkNameById = (chainId: number): string => {
  const { Goerli, Gnosis, Polygon } = EthereumNetworkNames;
  switch (chainId) {
    case 5:
      return Goerli;
    case 100:
      return Gnosis;
    case 137:
      return Polygon;
    default:
      // local network
      return Goerli;
  }
};
const Config: NetworksDeployments = {
  [EthereumNetworkNames.Gnosis]: {
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
      tokens: ['0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'], // wxDAI
    },
  },
  [EthereumNetworkNames.Goerli]: {
    aragon: {
      daoFactory: '0x0c514a00401666780fcA29d4CD6943085818F049',
      agentBase: '0x1B35F10413859D25Cf63D27336eF0434acF113FD',
    },
    superfluidProtocol: {
      cfav1: '0xEd6BcbF6907D4feEEe8a8875543249bEa9D308E8',
      host: '0x22ff293e14F1EC3A09B137e9e06084AFd63adDF9',
      supertokens: [
        '0xF2d68898557cCb2Cf4C10c3Ef2B034b2a69DAD00', // fDAIx
        '0x8aE68021f6170E5a766bE613cEA0d75236ECCa9a', // fUSDCx
      ],
      tokens: [
        '0x88271d333C72e51516B67f5567c728E702b3eeE8', // fDAI,
        '0xc94dd466416A7dFE166aB2cF916D3875C049EBB7', // fUSDC
      ],
    },
  },
};

export const getDeployments = (): Deployments => {
  return Config[getNetworkNameById(hre.network.config.chainId)];
};

export default NetworksDeployments;
