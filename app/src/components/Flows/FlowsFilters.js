import React from 'react';
import { DateRangePicker, DropDown, GU } from '@aragon/ui';

const DROPDOWN_WIDTH = '128px';

const FlowsFilters = ({
  dateRangeFilter,
  onTokenChange,
  symbols,
  tokenFilter,
  flowStates,
  flowTypes,
  flowStateFilter,
  flowTypeFilter,
  onDateRangeChange,
  onFlowStateChange,
  onFlowTypeChange,
}) => {
  return (
    <div
      css={`
        margin-bottom: ${1 * GU}px;
        display: inline-grid;
        grid-gap: ${1.5 * GU}px;
        grid-template-columns: auto auto auto auto;
      `}
    >
      <DropDown
        placeholder="State"
        header="State"
        items={flowStates}
        selected={flowStateFilter}
        onChange={onFlowStateChange}
        width={DROPDOWN_WIDTH}
      />
      <DropDown
        placeholder="Type"
        header="Type"
        items={flowTypes}
        selected={flowTypeFilter}
        onChange={onFlowTypeChange}
        width={DROPDOWN_WIDTH}
      />
      <DropDown
        placeholder="Token"
        header="Token"
        items={symbols}
        selected={tokenFilter}
        onChange={onTokenChange}
        width={DROPDOWN_WIDTH}
      />
      <DateRangePicker
        startDate={dateRangeFilter.start}
        endDate={dateRangeFilter.end}
        onChange={onDateRangeChange}
        format={'YYYY-MM-DD'}
      />
    </div>
  );
};

export default FlowsFilters;
