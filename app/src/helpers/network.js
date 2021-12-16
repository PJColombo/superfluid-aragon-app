const TEST_NETWORKS = ['goerly', 'kovan', 'rinkeby', 'ropsten', 'mumbai', 'private'];

export const isTestNetwork = network => TEST_NETWORKS.includes(network.toLowerCase());
