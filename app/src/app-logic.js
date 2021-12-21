import { useApi, useAppState } from '@aragon/api-react';
import { addressesEqual, noop } from '@aragon/ui';
import { useCallback } from 'react';
import usePanelState from './hooks/usePanelState';
import { toDecimals } from './helpers';

export const useUpdateFlow = (onDone = noop) => {
  const api = useApi();
  const { flows } = useAppState();

  return useCallback(
    async (tokenAddress, receiver, flowRate) => {
      const normalizedFlowRate = toDecimals(flowRate);
      const flow = flows.find(
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
    },
    [api]
  );
};

export const useDeleteFlow = (onDone = noop) => {
  const api = useApi();
  return useCallback(
    (tokenAddress, receiver) => {
      api.deleteFlow(tokenAddress, receiver).toPromise();
      onDone();
    },
    [api]
  );
};

export const useDeposit = (onDone = noop) => {
  const api = useApi();

  return useCallback(
    async (tokenAddress, amount, isExternalDeposit) => {
      const intentParams = {
        token: { address: tokenAddress, value: amount },
        // gas: 500000,
      };
      await api.deposit(tokenAddress, amount, isExternalDeposit, intentParams).toPromise();
      onDone();
    },
    [api]
  );
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
    deposit: useDeposit(transferPanel.requestClose),
  };

  return {
    actions,
    isSyncing,
    convertPanel,
    createFlowPanel,
    transferPanel,
  };
}
