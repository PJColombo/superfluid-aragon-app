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
import TokenBadge from '@aragon/ui/dist/TokenBadge';
import { compareDesc, format } from 'date-fns';
import { BN } from 'ethereumjs-blockchain/node_modules/ethereumjs-util';
import React, { useMemo } from 'react';
import { toChecksumAddress } from 'web3-utils';
import { MONTH } from '../../helpers';
import useFilteredFlows from '../../hooks/useFilteredFlows';
import DynamicFlowAmount from '../DynamicFlowAmount';
import LocalIdentityBadge from '../LocalIdentityBadge';
import { ContextMenuDeleteFlow, ContextMenuUpdateFlow } from './ContextMenus';
import FlowsFilters from './FlowsFilters';

const formatDate = date => format(date, 'yyyy-MM-dd');
const MONTH_BN = new BN(MONTH);

export default React.memo(({ disableMenu, flows, tokens, onUpdateFlow, onDeleteFlow }) => {
  const { appState, network } = useAragonApi();
  const { isSyncing } = appState;
  const connectedAccount = useConnectedAccount();
  const { layoutName } = useLayout();
  const theme = useTheme();

  const {
    emptyResultsViaFilters,
    filteredFlows,
    handleClearFilters,
    handleDateRangeChange,
    handleTokenChange,
    handleFlowTypeChange,
    page,
    setPage,
    selectedDateRange,
    selectedToken,
    selectedFlowType,
    symbols,
    flowTypes,
  } = useFilteredFlows({ flows, tokens });

  const tokenDetails = tokens.reduce((details, { address, decimals, symbol }) => {
    details[toChecksumAddress(address)] = {
      decimals,
      symbol,
    };
    return details;
  }, {});
  const compactMode = layoutName === 'small';

  const sortedFlows = useMemo(
    () =>
      filteredFlows.sort(({ date: dateLeft }, { date: dateRight }) =>
        // Sort by date descending
        compareDesc(dateLeft, dateRight)
      ),
    [filteredFlows]
  );

  const dataViewStatus = useMemo(() => {
    if (emptyResultsViaFilters && flows.length > 0) {
      return 'empty-filters';
    }
    if (isSyncing) {
      return 'loading';
    }
    return 'default';
  }, [isSyncing, emptyResultsViaFilters, flows]);

  return (
    <DataView
      status={dataViewStatus}
      emptyState={{
        default: { title: 'No flows yet.' },
        loading: {
          title: 'Loading flows',
        },
      }}
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
              dateRangeFilter={selectedDateRange}
              onDateRangeChange={handleDateRangeChange}
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
        { label: 'Start/End Date', priority: 3 },
        { label: 'Type', priority: 1 },
        { label: 'Token', priority: 2 },
        { label: 'Incoming/Outgoing (Per Month)', priority: 2 },
        { label: 'Total So Far', priority: 3 },
      ]}
      entries={sortedFlows}
      renderEntry={({
        accumulatedAmount,
        creationDate,
        entity,
        flowRate,
        lastUpdateDate,
        isIncoming,
        superTokenAddress,
      }) => {
        const formattedDate = format(creationDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        const { decimals, symbol } = tokenDetails[toChecksumAddress(superTokenAddress)];
        const monthlyFlowRate = flowRate.mul(MONTH_BN);

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
          <time
            dateTime={formattedDate}
            title={formattedDate}
            css={`
              padding-right: ${2 * GU}px;
              white-space: nowrap;
            `}
          >
            {formatDate(creationDate)}
          </time>,
          <div>{isIncoming ? 'Incoming' : 'Outgoing'}</div>,
          <TokenBadge address={superTokenAddress} symbol={symbol} networkType={network.type} />,
          <div
            css={`
              color: ${isIncoming ? theme.positive : theme.negative};
              padding: ${1 * GU}px ${0.5 * GU}px;
              overflow-wrap: break-word;
              word-break: break-word;
              hyphens: auto;
            `}
          >
            {formatTokenAmount(isIncoming ? monthlyFlowRate : monthlyFlowRate.neg(), 18, {
              digits: 2,
              displaySign: true,
            })}
          </div>,
          <div
            css={`
              font-weight: 600;
              color: ${isIncoming ? theme.positive : theme.negative};
              min-width: 80%;
            `}
          >
            <DynamicFlowAmount
              baseAmount={accumulatedAmount}
              rate={flowRate}
              lastDate={lastUpdateDate}
            >
              <TotalSoFar decimals={decimals} isIncoming={isIncoming} />
            </DynamicFlowAmount>
          </div>,
        ];
      }}
      renderEntryActions={({ superTokenAddress, entity }) => (
        <ContextMenu disabled={disableMenu} zIndex={1}>
          <ContextMenuUpdateFlow
            onUpdateFlow={() =>
              onUpdateFlow({ updateSuperTokenAddress: superTokenAddress, updateRecipient: entity })
            }
          />
          <ContextMenuDeleteFlow onDeleteFlow={() => onDeleteFlow(superTokenAddress, entity)} />
        </ContextMenu>
      )}
    />
  );
});

const TotalSoFar = ({ dynamicAmount, isIncoming, decimals }) => {
  const [integer, fractional] = formatTokenAmount(
    isIncoming ? dynamicAmount : dynamicAmount.neg(),
    decimals,
    {
      digits: 6,
      displaySign: true,
    }
  ).split('.');

  return (
    <span>
      <span
        css={`
          ${textStyle('body1')};
        `}
      >
        {integer}
      </span>
      {fractional && (
        <span
          css={`
            ${textStyle('body3')}
          `}
        >
          .{fractional}
        </span>
      )}
    </span>
  );
};
