import { useAragonApi, useConnectedAccount } from '@aragon/api-react';
import {
  addressesEqual,
  ContextMenu,
  DataView,
  formatTokenAmount,
  GU,
  textStyle,
  useLayout,
  useTheme,
} from '@aragon/ui';
import { compareDesc, format } from 'date-fns';
import React, { useMemo } from 'react';
import { toChecksumAddress } from 'web3-utils';
import useFilteredFlows from '../../hooks/useFilteredFlows';
import LocalIdentityBadge from '../LocalIdentityBadge';
import { ContextMenuDeleteFlow, ContextMenuUpdateFlow } from './ContextMenus';
import FlowsFilters from './FlowsFilters';

const formatDate = date => format(date, 'yyyy-MM-dd');

function useFlowItems(superTokens) {
  const balanceItems = useMemo(() => {
    let flows = []
    // amount, entity, isIncoming, flowRate, token
    for (const { address, balance: amount, metadata: { decimals, symbols }, netflow, inFlows, outFlows } of superTokens) {
      for(const { flowRate, sender } in inFlows) {
        flows.push({ isIncoming: true, flowRate: flowRate, token: {decimals, symbols }, sender })
      }
    }

    return superTokens.map(
      ({ address, balance: amount, metadata: { decimals, symbol }, netFlow }) => {
        return {
          address,
          amount,
          convertedAmount: new BN('-1'),
          decimals,
          symbol,
          netFlow,
          // verified,
        };
      },
      [superTokens]
    );
  });
  return balanceItems;
}
export default React.memo(({ tokens, flows }) => {
  const { appState } = useAragonApi();
  const connectedAccount = useConnectedAccount();
  const { layoutName } = useLayout();
  const theme = useTheme();
  const { isSyncing, superTokens } = appState

  const {
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
    flowTypes,
  } = useFilteredFlows({ flows, tokens });

  const { isSyncing } = appState;
  const tokenDetails = tokens.reduce((details, { address, decimals, symbol }) => {
    details[toChecksumAddress(address)] = {
      decimals,
      symbol,
    };
    return details;
  }, {});
  const compactMode = layoutName === 'small';

  const sortedTransfers = useMemo(
    () =>
      filteredFlows.sort(({ date: dateLeft }, { date: dateRight }) =>
        // Sort by date descending
        compareDesc(dateLeft, dateRight)
      ),
    [filteredFlows, compareDesc]
  );

  const dataViewStatus = useMemo(() => {
    if (emptyResultsViaFilters && flows.length > 0) {
      return 'empty-filters';
    }
    if (appState.isSyncing) {
      return 'loading';
    }
    return 'default';
  }, [isSyncing, emptyResultsViaFilters, flows]);

  return (
    <DataView
      status={dataViewStatus}
      statusEmpty={
        <p
          css={`
            ${textStyle('title2')};
          `}
        >
          No Flows yet.
        </p>
      }
      page={page}
      onPageChange={setPage}
      onStatusEmptyClear={handleClearFilters}
      heading={
        <React.Fragment>
          <div
            css={`
              padding-bottom: ${2 * GU}px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            `}
          >
            <div
              css={`
                color: ${theme.content};
                ${textStyle('body1')};
              `}
            >
              Flows
            </div>
          </div>
          {!compactMode && (
            <FlowsFilters
              onTokenChange={handleTokenChange}
              onFlowTypeChange={handleFlowTypeChange}
              tokenFilter={selectedToken}
              flowTypeFilter={selectedFlowType}
              flowTypes={flowTypes}
              symbols={symbols}
            />
          )}
        </React.Fragment>
      }
      fields={[
        { label: 'To/From', priority: 3 },
        { label: 'Type', priority: 1 },
        { label: 'Token', priority: 2 },
        { label: 'Flow Rate', priority: 2 },
        { label: 'Total', priority: 3 },
      ]}
      entries={sortedTransfers}
      renderEntry={({ amount, entity, isIncoming, flowRate, token }) => {
        const { symbol, decimals } = tokenDetails[toChecksumAddress(token)];

        const formattedAmount = formatTokenAmount(isIncoming ? amount : amount.neg(), decimals, {
          displaySign: true,
          digits: 5,
          symbol,
        });

        return [
          <div
            css={`
              padding: 0 ${0.5 * GU}px;
              ${!compactMode
                ? `
                    display: inline-flex;
                    max-width: ${layoutName === 'large' ? 'unset' : '150px'};
                  `
                : ''};
            `}
          >
            <LocalIdentityBadge
              connectedAccount={addressesEqual(entity, connectedAccount)}
              entity={entity}
            />
          </div>,
          <div
            css={`
              padding: ${1 * GU}px ${0.5 * GU}px;
              overflow-wrap: break-word;
              word-break: break-word;
              hyphens: auto;
            `}
          >
            {flowRate}
          </div>,
          <span
            css={`
              font-weight: 600;
              color: ${isIncoming ? theme.positive : theme.negative};
            `}
          >
            {formattedAmount}
          </span>,
        ];
      }}
      renderEntryActions={({ entity, transactionHash }) => (
        <ContextMenu zIndex={1}>
          <ContextMenuUpdateFlow onUpdateFlow={transactionHash} />
          <ContextMenuDeleteFlow onDeleteFlow={entity} />
        </ContextMenu>
      )}
    />
  );
});
