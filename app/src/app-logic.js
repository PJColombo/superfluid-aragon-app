import { useApi, useAppState } from '@aragon/api-react';
import { noop } from '@aragon/ui';
import { useCallback } from 'react';
import superTokenAbi from './abi/RawSuperToken.json';
import usePanelState from './hooks/usePanelState';
import { addressesEqual, toDecimals } from './helpers';
import { UPGRADE, DOWNGRADE } from './super-token-operations';

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
    [api, flows, onDone]
  );
};

export const useDeleteFlow = (onDone = noop) => {
  const api = useApi();
  return useCallback(
    (tokenAddress, receiver) => {
      api.deleteFlow(tokenAddress, receiver).toPromise();
      onDone();
    },
    [api, onDone]
  );
};

export const useDeposit = (onDone = noop) => {
  const api = useApi();

  return useCallback(
    async (tokenAddress, amount, isExternalDeposit) => {
      const intentParams = {
        token: { address: tokenAddress, value: amount },
      };
      await api.deposit(tokenAddress, amount, isExternalDeposit, intentParams).toPromise();
      onDone();
    },
    [api, onDone]
  );
};

export const useConvertTokens = (onDone = noop) => {
  const api = useApi();

  return useCallback(
    async (operation, superTokenAddress, amount) => {
      const superToken = api.external(superTokenAddress, superTokenAbi);
      const underlyingTokenAddress = await superToken.getUnderlyingToken().toPromise();

      const intentParams = {
        token: { address: underlyingTokenAddress, value: amount },
      };

      if (operation === UPGRADE) {
        await superToken.upgrade(amount, intentParams).toPromise();
      } else if (operation === DOWNGRADE) {
        await superToken.downgrade(amount, intentParams).toPromise();
      } else {
        throw new Error('Convert operation unknown');
      }

      onDone();
    },
    [api, onDone]
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
    convertTokens: useConvertTokens(convertPanel.requestClose),
  };

  return {
    actions,
    isSyncing,
    convertPanel,
    createFlowPanel,
    transferPanel,
  };
}
