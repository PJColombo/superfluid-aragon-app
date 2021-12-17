import { addressesEqual } from '@aragon/ui';
import { endOfDay, isAfter, isBefore, startOfDay } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FLOW_TYPES, FLOW_TYPES_LABELS, Incoming, Outgoing } from '../flow-types';

const UNSELECTED_TOKEN_FILTER = -1;
const UNSELECTED_FLOW_TYPE_FILTER = -1;
const UNSELECTED_DATE_RANGE_FILTER = { start: null, end: null };

function useFilteredFlows({ flows, tokens }) {
  const [page, setPage] = useState(0);
  const [selectedDateRange, setSelectedDateRange] = useState(UNSELECTED_DATE_RANGE_FILTER);
  const [selectedFlowType, setSelectedFlowType] = useState(UNSELECTED_FLOW_TYPE_FILTER);
  const [selectedToken, setSelectedToken] = useState(UNSELECTED_TOKEN_FILTER);

  useEffect(() => setPage(0), [selectedDateRange, selectedFlowType, selectedToken]);

  const handleSelectedDateRangeChange = useCallback(range => {
    setSelectedDateRange(range);
  }, []);

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
    setSelectedDateRange(UNSELECTED_DATE_RANGE_FILTER);
  }, []);

  const tokensToFilter = useMemo(
    () => [{ symbol: 'All tokens' }, ...tokens.map(({ address, symbol }) => ({ address, symbol }))],
    [tokens]
  );

  const filteredFlows = useMemo(
    () =>
      flows.filter(({ creationDate, isIncoming, superTokenAddress }) => {
        const type = isIncoming ? Incoming : Outgoing;
        // Exclude by flow type
        if (selectedFlowType !== -1 && FLOW_TYPES[selectedFlowType] !== type) {
          return false;
        }

        // Filter separately by start and end date.
        if (
          selectedDateRange.start &&
          isBefore(creationDate, startOfDay(selectedDateRange.start))
        ) {
          return false;
        }
        if (selectedDateRange.end && isAfter(creationDate, endOfDay(selectedDateRange.end))) {
          return false;
        }

        // Exclude by token
        if (
          selectedToken > 0 &&
          !addressesEqual(superTokenAddress, tokensToFilter[selectedToken].address)
        ) {
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
    handleSelectedDateRangeChange,
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
