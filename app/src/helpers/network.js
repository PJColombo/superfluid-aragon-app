const TEST_NETWORKS = ['goerly', 'kovan', 'rinkeby', 'ropsten', 'mumbai', 'private'];

export const LOCAL_NETWORK_ID = 1337;

const TEST_NETWORK_IDS = [5, 42, 4, 3, 80001, LOCAL_NETWORK_ID];

export const isTestNetwork = network =>
  TEST_NETWORKS.includes(network.type.toLowerCase()) && TEST_NETWORK_IDS.includes(network.id);
