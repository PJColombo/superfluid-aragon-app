import React from 'react';
import { DropDown, GU } from '@aragon/ui';

const FlowsFilters = ({
  onTokenChange,
  symbols,
  tokenFilter,
  flowTypes,
  flowTypeFilter,
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
    </div>
  );
};

export default FlowsFilters;
