import React from 'react';
import { DateRangePicker, DropDown, GU } from '@aragon/ui';

const FlowsFilters = ({
  dateRangeFilter,
  onTokenChange,
  symbols,
  tokenFilter,
  flowTypes,
  flowTypeFilter,
  onDateRangeChange,
  onFlowTypeChange,
}) => {
  return (
    <div
      css={`
        margin-bottom: ${1 * GU}px;
        display: inline-grid;
        grid-gap: ${1.5 * GU}px;
        grid-template-columns: auto auto auto;
      `}
    >
      <DropDown
        placeholder="Type"
        header="Type"
        items={flowTypes}
        selected={flowTypeFilter}
        onChange={onFlowTypeChange}
        width="128px"
      />
      <DropDown
        placeholder="Token"
        header="Token"
        items={symbols}
        selected={tokenFilter}
        onChange={onTokenChange}
        width="128px"
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
