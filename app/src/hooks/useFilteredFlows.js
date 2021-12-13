import { useCallback, useMemo, useState } from 'react';
import { FLOW_TYPES, FLOW_TYPES_LABELS, Incoming, Outgoing } from '../flow-types';
import { addressesEqual } from '../lib/web3-utils';

const UNSELECTED_TOKEN_FILTER = -1;
const UNSELECTED_FLOW_TYPE_FILTER = -1;

function useFilteredFlows({ flows, tokens }) {
  const [page, setPage] = useState(0);
  const [selectedFlowType, setSelectedFlowType] = useState(UNSELECTED_FLOW_TYPE_FILTER);
  const [selectedToken, setSelectedToken] = useState(UNSELECTED_TOKEN_FILTER);

  const handleTokenChange = useCallback(index => {
    const tokenIndex = index === 0 ? UNSELECTED_TOKEN_FILTER : index;
    setSelectedToken(tokenIndex);
  }, []);
  const handleFlowTypeChange = useCallback(index => {
    const flowTypeIndex = index === 0 ? UNSELECTED_FLOW_TYPE_FILTER : index;
    setSelectedFlowType(flowTypeIndex);
  }, []);
  const handleClearFilters = useCallback(() => {
    setSelectedFlowType(UNSELECTED_FLOW_TYPE_FILTER);
    setSelectedToken(UNSELECTED_TOKEN_FILTER);
  }, []);

  const tokensToFilter = useMemo(() => [{ symbol: 'All tokens' }, ...tokens], [tokens]);

  const filteredFlows = useMemo(
    () =>
      flows.filter(({ isIncoming, token }) => {
        const type = isIncoming ? Incoming : Outgoing;
        // Exclude by flow type
        if (selectedFlowType !== -1 && FLOW_TYPES[selectedFlowType] !== type) {
          return false;
        }
        // Exclude by token
        if (selectedToken > 0 && !addressesEqual(token, tokensToFilter[selectedToken].address)) {
          return false;
        }

        // All good, we can include the flow ✌️
        return true;
      }),
    [selectedFlowType, selectedToken, tokensToFilter, flows]
  );
  const symbols = tokensToFilter.map(({ symbol }) => symbol);
  const emptyResultsViaFilters = !filteredFlows && (selectedToken > 0 || selectedFlowType > 0);

  return {
    emptyResultsViaFilters,
    filteredFlows,
    handleClearFilters,
    handleTokenChange,
    handleFlowTypeChange,
    page,
    setPage,
    selectedToken,
    selectedFlowType,
    symbols,
    flowTypes: FLOW_TYPES_LABELS,
  };
}

export default useFilteredFlows;
