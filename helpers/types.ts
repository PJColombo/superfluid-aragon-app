export enum EthereumNetworkNames {
  Goerli = 'goerli',
  Polygon = 'polygon',
  Mumbai = 'mumbai',
  Rinkeby = 'rinkeby',
  Xdai = 'xdai',
}

export interface Deployments {
  aragon: {
    daoFactory: string;
    agentBase: string;
  };
  superfluidProtocol: {
    cfav1: string;
    host: string;
    supertokens: string[];
    tokens: string[];
  };
}

export interface NetworksDeployments {
  [key: string]: Deployments;
}
