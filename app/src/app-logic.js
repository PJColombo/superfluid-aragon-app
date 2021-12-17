import { useApi, useAppState, useAragonApi } from '@aragon/api-react';
import { addressesEqual, noop } from '@aragon/ui';
import { useCallback } from 'react';
import usePanelState from './hooks/usePanelState';
import { toDecimals } from './helpers';

export const useUpdateFlow = (onDone = noop) => {
  const api = useApi();
  const { appState } = useAragonApi();

  return useCallback(async (tokenAddress, receiver, flowRate) => {
    const normalizedFlowRate = toDecimals(flowRate);
    const flow = appState.flows.find(
      f =>
        !f.isIncoming &&
        addressesEqual(f.entity, receiver) &&
        addressesEqual(f.superTokenAddress, tokenAddress)
    );

    try {
      if (flow) {
        await api.updateFlow(tokenAddress, receiver, normalizedFlowRate).toPromise();
      } else {
        await api.createFlow(tokenAddress, receiver, normalizedFlowRate).toPromise();
      }
    } catch (err) {
      console.error(err);
    }

    onDone();
  });
};

export const useDeleteFlow = (onDone = noop) => {
  const api = useApi();
  return useCallback((tokenAddress, receiver) => {
    api.deleteFlow(tokenAddress, receiver).toPromise();
    onDone();
  });
};

// Handles the main logic of the app.
export function useAppLogic() {
  const { isSyncing } = useAppState();
  const convertPanel = usePanelState();
  const createFlowPanel = usePanelState();
  const transferPanel = usePanelState();

  const actions = {
    updateFlow: useUpdateFlow(createFlowPanel.requestClose),
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
