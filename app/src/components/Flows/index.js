import { useAragonApi, useConnectedAccount } from '@aragon/api-react';
import {
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
import { addressesEqual, MONTH } from '../../helpers';
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
    handleFlowStateChange,
    handleFlowTypeChange,
    page,
    setPage,
    selectedDateRange,
    selectedToken,
    selectedFlowState,
    selectedFlowType,
    symbols,
    flowStates,
    flowTypes,
  } = useFilteredFlows({ flows, tokens });

  const tokenDetails = tokens.reduce((details, { address, decimals, symbol }) => {
    details[toChecksumAddress(address)] = {
      decimals,
      symbol,
    };
    return details;
  }, {});
  const compactMode = layoutName === 'small' || layoutName === 'medium';

  const sortedFlows = useMemo(
    () =>
      filteredFlows.sort(
        (
          { creationDate: dateLeft, isCancelled: isCancelledLeft },
          { creationDate: dateRight, isCancelled: isCancelledRight }
        ) => {
          // Open flows have priority over close ones
          if (!isCancelledLeft && isCancelledRight) {
            return -1;
          } else if (isCancelledLeft && !isCancelledRight) {
            return 1;
          } else if (isCancelledLeft && isCancelledRight) {
            return 0;
          }
          // Sort by date descending
          else {
            return compareDesc(dateLeft, dateRight);
          }
        }
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
      mode={compactMode ? 'list' : 'table'}
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
              onFlowStateChange={handleFlowStateChange}
              onFlowTypeChange={handleFlowTypeChange}
              tokenFilter={selectedToken}
              flowStateFilter={selectedFlowState}
              flowTypeFilter={selectedFlowType}
              flowStates={flowStates}
              flowTypes={flowTypes}
              symbols={symbols}
            />
          )}
        </React.Fragment>
      }
      fields={[
        { label: 'To/From', priority: 6 },
        { label: 'Start/End Date', priority: 5 },
        { label: 'Type', priority: 4 },
        { label: 'Token', priority: 3 },
        {
          label: (
            <span title="Incoming/Outgoing">
              {compactMode ? 'Incoming/Outgoing' : 'INC/OG'} (Per Month)
            </span>
          ),
          priority: 2,
        },
        { label: 'Total So Far', align: 'start', priority: 1 },
      ]}
      entries={sortedFlows}
      renderEntry={({
        accumulatedAmount,
        creationDate,
        entity,
        flowRate,
        lastUpdateDate,
        isCancelled,
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
          <div
            css={`
              display: flex;
              flex-wrap: wrap;
            `}
          >
            <FlowDate date={creationDate} dateTime={formattedDate} />
            <span
              css={`
                margin: 0 ${1 * GU}px;
              `}
            >
              -
            </span>
            {isCancelled ? <FlowDate date={lastUpdateDate} dateTime={formattedDate} /> : 'Present'}
          </div>,
          <div>{isIncoming ? 'Incoming' : 'Outgoing'}</div>,
          <TokenBadge address={superTokenAddress} symbol={symbol} networkType={network.type} />,
          <div
            css={`
              color: ${isIncoming ? theme.positive : theme.negative};
              padding: ${1 * GU}px ${0.5 * GU}px;
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
            `}
          >
            {isCancelled ? (
              <TotalSoFar
                dynamicAmount={accumulatedAmount}
                decimals={decimals}
                isIncoming={isIncoming}
              />
            ) : (
              <DynamicFlowAmount
                baseAmount={accumulatedAmount}
                rate={flowRate}
                lastDate={lastUpdateDate}
              >
                <TotalSoFar decimals={decimals} isIncoming={isIncoming} />
              </DynamicFlowAmount>
            )}
          </div>,
        ];
      }}
      renderEntryActions={({ superTokenAddress, entity, isCancelled }) =>
        isCancelled ? null : (
          <ContextMenu disabled={disableMenu} zIndex={1}>
            <ContextMenuUpdateFlow
              onUpdateFlow={() =>
                onUpdateFlow({
                  updateSuperTokenAddress: superTokenAddress,
                  updateRecipient: entity,
                })
              }
            />
            <ContextMenuDeleteFlow onDeleteFlow={() => onDeleteFlow(superTokenAddress, entity)} />
          </ContextMenu>
        )
      }
    />
  );
});

const FlowDate = ({ dateTime, date }) => (
  <time
    dateTime={dateTime}
    title={dateTime}
    css={`
      white-space: nowrap;
    `}
  >
    {formatDate(date)}
  </time>
);

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
    <div
      css={`
        display: flex;
      `}
    >
      <span
        css={`
          ${textStyle('body1')};
        `}
      >
        {integer}
      </span>
      {fractional && (
        <div
          css={`
            ${textStyle('body3')};
            min-width: ${9 * GU}px;
            align-self: center;
          `}
        >
          .{fractional}
        </div>
      )}
    </div>
  );
};
