export enum EthereumNetworkNames {
  goerli = "goerli",
  polygon = "polygon",
  mumbai = "mumbai",
  rinkeby = "rinkeby",
  xdai = "xdai",
}

export interface Deployments {
  aragon: {
    daoFactory: string;
    agentBase: string;
  };
  superfluid: {
    cfav1: string;
    host: string;
    supertokens: string[];
    tokens: string[];

  }
}

export interface NetworksDeployments {
  [key: string]: Deployments;
}