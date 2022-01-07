const TEST_NETWORKS = ['goerly', 'kovan', 'rinkeby', 'ropsten', 'mumbai', 'private'];

export const LOCAL_NETWORK_ID = 1337;

export const isTestNetwork = network => TEST_NETWORKS.includes(network.type.toLowerCase());
