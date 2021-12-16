import { useApi, useAppState, useAragonApi } from '@aragon/api-react';
import { addressesEqual, noop } from '@aragon/ui';
import { useCallback, useEffect, useState } from 'react';
import usePanelState from './hooks/usePanelState';
import cfaV1ABI from './abi/CFAv1.json';
import { toDecimals } from './helpers';

export const useUpdateFlow = (onDone = noop, cfa) => {
  const api = useApi();
  const { appState } = useAragonApi();

  return useCallback(async (tokenAddress, receiver, flowRate) => {
    const normalizedFlowRate = toDecimals(flowRate);
    const flow = appState.outFlows.find(
      f => addressesEqual(f.receiver, receiver) && addressesEqual(f.superTokenAddress, tokenAddress)
    );

    let res;
    try {
      if (flow) {
        res = await api.updateFlow(tokenAddress, receiver, normalizedFlowRate).toPromise();
      } else {
        res = await api.createFlow(tokenAddress, receiver, normalizedFlowRate).toPromise();
      }
    } catch (err) {
      console.err(err);
    }
    console.log(res);
    onDone();
  });
};

export const useDeleteFlow = (onDone = noop) => {
  const api = useApi();
  return useCallback((tokenAddress, sender, receiver) => {
    api.deleteFlow(tokenAddress, sender, receiver).toPromise();
    onDone();
  });
};

// Handles the main logic of the app.
export function useAppLogic() {
  const { isSyncing } = useAppState();
  const convertPanel = usePanelState();
  const createFlowPanel = usePanelState();
  const transferPanel = usePanelState();
  const api = useApi();
  const [cfa, setCFA] = useState();

  useEffect(() => {
    if (!api) {
      return;
    }

    const fetchCFA = async () => {
      const cfa = api.external(await api.call('cfa').toPromise(), cfaV1ABI);
      console.log('here');
      console.log(cfa);
      setCFA(cfa);
    };

    fetchCFA();
  }, [api]);

  const actions = {
    updateFlow: useUpdateFlow(createFlowPanel.requestClose, cfa),
    deleteFlow: useDeleteFlow(),
  };

  return {
    actions,
    isSyncing,
    convertPanel,
    createFlowPanel,
    transferPanel,
  };
}
