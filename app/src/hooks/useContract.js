import { useApi } from '@aragon/api-react';
import { useMemo } from 'react';

const useContract = (address, abi) => {
  const api = useApi();

  return useMemo(() => {
    if (!address) {
      return null;
    }
    return api.external(address, abi);
  }, [api, abi, address]);
};

export default useContract;
