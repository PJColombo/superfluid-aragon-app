import { endOfDay, isAfter, isBefore, startOfDay } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Close,
  FLOW_STATES,
  FLOW_STATES_LABELS,
  FLOW_TYPES,
  FLOW_TYPES_LABELS,
  Incoming,
  Open,
  Outgoing,
} from '../flow';
import { addressesEqual } from '../helpers';

const UNSELECTED_TOKEN_FILTER = -1;
const UNSELECTED_FLOW_STATE_FILTER = -1;
const UNSELECTED_FLOW_TYPE_FILTER = -1;
const UNSELECTED_DATE_RANGE_FILTER = { start: null, end: null };

function useFilteredFlows({ flows, tokens }) {
  const [page, setPage] = useState(0);
  const [selectedDateRange, setSelectedDateRange] = useState(UNSELECTED_DATE_RANGE_FILTER);
  const [selectedFlowState, setSelectedFlowState] = useState(UNSELECTED_FLOW_STATE_FILTER);
  const [selectedFlowType, setSelectedFlowType] = useState(UNSELECTED_FLOW_TYPE_FILTER);
  const [selectedToken, setSelectedToken] = useState(UNSELECTED_TOKEN_FILTER);

  useEffect(() => setPage(0), [selectedDateRange, selectedFlowType, selectedToken]);

  const handleDateRangeChange = useCallback(range => {
    setSelectedDateRange(range);
  }, []);

  const handleTokenChange = useCallback(index => {
    const tokenIndex = index === 0 ? UNSELECTED_TOKEN_FILTER : index;
    setSelectedToken(tokenIndex);
  }, []);

  const handleFlowStateChange = useCallback(index => {
    const flowStateIndex = index === 0 ? UNSELECTED_FLOW_STATE_FILTER : index;
    setSelectedFlowState(flowStateIndex);
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
      flows.filter(({ creationDate, isCancelled, isIncoming, superTokenAddress }) => {
        const state = isCancelled ? Close : Open;
        const type = isIncoming ? Incoming : Outgoing;
        // Exclude by flow state
        if (
          selectedFlowState !== UNSELECTED_FLOW_STATE_FILTER &&
          FLOW_STATES[selectedFlowState] !== state
        ) {
          return false;
        }

        // Exclude by flow type
        if (
          selectedFlowType !== UNSELECTED_FLOW_TYPE_FILTER &&
          FLOW_TYPES[selectedFlowType] !== type
        ) {
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
    [selectedDateRange, selectedFlowState, selectedFlowType, selectedToken, tokensToFilter, flows]
  );
  const symbols = tokensToFilter.map(({ symbol }) => symbol);
  const emptyResultsViaFilters = !filteredFlows && (selectedToken > 0 || selectedFlowType > 0);

  return {
    emptyResultsViaFilters,
    filteredFlows,
    handleClearFilters,
    handleDateRangeChange,
    handleTokenChange,
    handleFlowStateChange,
    handleFlowTypeChange,
    page,
    setPage,
    selectedDateRange,
    selectedToken,
    selectedFlowState,
    selectedFlowType,
    symbols,
    flowStates: FLOW_STATES_LABELS,
    flowTypes: FLOW_TYPES_LABELS,
  };
}

export default useFilteredFlows;
