import { useApi, useAppState } from '@aragon/api-react';
import { noop } from '@aragon/ui';
import React, { useCallback, useEffect, useState } from 'react';
import usePanelState from './hooks/usePanelState';
import cfaV1ABI from './abi/CFAv1.json';
import { toDecimals } from './helpers/math-helpers';

export const useUpdateFlow = (onDone = noop, cfa) => {
  const api = useApi();
  return useCallback(async (tokenAddress, receiver, flowRate) => {
    const normalizedFlowRate = toDecimals(flowRate);
    const agentAddress = await api.call('agent').toPromise();
    const flow = await cfa.getFlow(tokenAddress, agentAddress, receiver).toPromise();

    if (flow?.timestamp > 0) {
      api.updateFlow(tokenAddress, receiver, normalizedFlowRate).toPromise();
    } else {
      api.createFlow(tokenAddress, receiver, normalizedFlowRate).toPromise();
    }

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
  const newFlowPanel = usePanelState();
  const newDepositPanel = usePanelState();
  const api = useApi();
  const [cfa, setCFA] = useState();

  useEffect(() => {
    if (!api) {
      return;
    }

    const fetchCFA = async () => {
      const cfa = api.external(await api.call('cfa').toPromise(), cfaV1ABI);
      setCFA(cfa);
    };

    fetchCFA();
  }, [api]);

  const actions = {
    updateFlow: useUpdateFlow(newFlowPanel.requestClose, cfa),
    deleteFlow: useDeleteFlow(),
  };

  return {
    actions,
    isSyncing,
    newFlowPanel,
    newDepositPanel,
  };
}
