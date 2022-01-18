import { useApi, useAppState } from '@aragon/api-react';
import { noop } from '@aragon/ui';
import { useCallback } from 'react';
import superTokenAbi from './abi/RawSuperToken.json';
import usePanelState from './hooks/usePanelState';
import { addressesEqual, callAgreement, ZERO_ADDRESS } from './helpers';
import { UPGRADE, DOWNGRADE } from './super-token-operations';
import useContract from './hooks/useContract';
import hostABI from './abi/Host.json';

export const useUpdateFlow = (host, onDone = noop) => {
  const api = useApi();
  const { cfaAddress, flows } = useAppState();

  return useCallback(
    async (tokenAddress, sender, receiver, flowRate, isOutgoingFlow) => {
      const useAgreementContract = !isOutgoingFlow;

      const flow = flows.find(
        f =>
          !f.isCancelled &&
          (isOutgoingFlow ? !f.isIncoming : f.isIncoming) &&
          addressesEqual(f.entity, isOutgoingFlow ? receiver : sender) &&
          addressesEqual(f.superTokenAddress, tokenAddress)
      );

      try {
        if (flow) {
          if (useAgreementContract) {
            await callAgreement(host, cfaAddress, [tokenAddress, receiver, flowRate, '0x'], true);
          } else {
            await api.updateFlow(tokenAddress, receiver, flowRate).toPromise();
          }
        } else {
          if (useAgreementContract) {
            await callAgreement(host, cfaAddress, [tokenAddress, receiver, flowRate, '0x']);
          } else {
            await api.createFlow(tokenAddress, receiver, flowRate).toPromise();
          }
        }
      } catch (err) {
        console.error(err);
      }

      onDone();
    },
    [api, cfaAddress, host, flows, onDone]
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
    deleteFlow: useDeleteFlow(),
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
