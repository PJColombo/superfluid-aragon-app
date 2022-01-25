import { useApi, useAppState } from '@aragon/api-react';
import { noop } from '@aragon/ui';
import { useCallback } from 'react';
import superTokenAbi from './abi/RawSuperToken.json';
import usePanelState from './hooks/usePanelState';
import { addressesEqual, callAgreement, ZERO_ADDRESS } from './helpers';
import { UPGRADE, DOWNGRADE } from './super-token-operations';
import useContract from './hooks/useContract';
import hostABI from './abi/Host.json';
import { createFlowABI, deleteFlowABI, updateFlowABI } from './abi/cfav1-operations/';

export const useUpdateFlow = (host, onDone = noop) => {
  const api = useApi();
  const { agentAddress, cfaAddress, flows } = useAppState();

  return useCallback(
    async (tokenAddress, entity, flowRate, description, isOutgoingFlow) => {
      const flow = flows.find(
        f =>
          !f.isCancelled &&
          (isOutgoingFlow ? !f.isIncoming : f.isIncoming) &&
          addressesEqual(f.entity, entity) &&
          addressesEqual(f.superTokenAddress, tokenAddress)
      );
      const flowDescription = description && description.length ? description : '0x';

      try {
        if (flow) {
          if (!isOutgoingFlow) {
            await callAgreement(
              host,
              cfaAddress,
              [tokenAddress, agentAddress, flowRate, '0x'],
              flowDescription,
              updateFlowABI
            );
          } else {
            await api.updateFlow(tokenAddress, entity, flowRate, flowDescription).toPromise();
          }
        } else {
          if (!isOutgoingFlow) {
            await callAgreement(
              host,
              cfaAddress,
              [tokenAddress, agentAddress, flowRate, '0x'],
              flowDescription,
              createFlowABI
            );
          } else {
            await api.createFlow(tokenAddress, entity, flowRate, flowDescription).toPromise();
          }
        }
      } catch (err) {
        console.error(err);
      }

      onDone();
    },
    [agentAddress, api, cfaAddress, host, flows, onDone]
  );
};

export const useDeleteFlow = (host, onDone = noop) => {
  const api = useApi();
  const { agentAddress, cfaAddress } = useAppState();
  return useCallback(
    (tokenAddress, entity, isOutgoingFlow) => {
      if (isOutgoingFlow) {
        api.deleteFlow(tokenAddress, entity).toPromise();
      } else {
        callAgreement(host, cfaAddress, [tokenAddress, entity, agentAddress, '0x'], deleteFlowABI);
      }
      onDone();
    },
    [agentAddress, api, cfaAddress, host, onDone]
  );
};

export const useDeposit = (onDone = noop) => {
  const api = useApi();

  return useCallback(
    async (tokenAddress, amount, isExternalDeposit = true) => {
      const intentParams = {
        token: { address: tokenAddress, value: amount },
      };
      await api.deposit(tokenAddress, amount, isExternalDeposit, intentParams).toPromise();
      onDone();
    },
    [api, onDone]
  );
};

export const useWithdraw = (onDone = noop) => {
  const api = useApi();

  return useCallback(
    async (tokenAddress, receiver, amount) => {
      await api.withdraw(tokenAddress, receiver, amount).toPromise();
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
      const isNativeSuperToken = addressesEqual(underlyingTokenAddress, ZERO_ADDRESS);

      if (operation === UPGRADE) {
        let intentParams = {};

        /**
         * Check if it's a native Super Token and pass amount as value. Otherwise,
         * set up approve pre-tx data.
         */
        if (isNativeSuperToken) {
          intentParams.value = amount;
          await superToken.upgradeByETH(intentParams).toPromise();
        } else {
          intentParams.token = { address: underlyingTokenAddress, value: amount };
          await superToken.upgrade(amount, intentParams).toPromise();
        }
      } else if (operation === DOWNGRADE) {
        if (isNativeSuperToken) {
          await superToken.downgradeToETH(amount).toPromise();
        } else {
          await superToken.downgrade(amount).toPromise();
        }
      } else {
        throw new Error('Convert operation unknown.');
      }

      onDone();
    },
    [api, onDone]
  );
};

// Handles the main logic of the app.
export function useAppLogic() {
  const { hostAddress } = useAppState();
  const convertPanel = usePanelState();
  const createFlowPanel = usePanelState();
  const transferPanel = usePanelState();
  const host = useContract(hostAddress, hostABI);

  const actions = {
    updateFlow: useUpdateFlow(host, createFlowPanel.requestClose),
    deleteFlow: useDeleteFlow(host),
    deposit: useDeposit(transferPanel.requestClose),
    withdraw: useWithdraw(transferPanel.requestClose),
    convertTokens: useConvertTokens(convertPanel.requestClose),
  };

  return {
    actions,
    convertPanel,
    createFlowPanel,
    transferPanel,
  };
}
