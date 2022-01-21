import { Details, GU, IconWarning, Info } from '@aragon/ui';
import { compareAsc, differenceInDays, format, formatDistance } from 'date-fns';
import React, { useMemo } from 'react';
import { addressesEqual, calculateDepletionDate } from '../helpers';

const WARNING_THRESHOLD_DAYS = 15;

const IncomingFlowsWarnings = ({ incomingFlowTokens, superTokens }) => {
  const filteredSuperTokens = useMemo(() => {
    const now = new Date();

    return incomingFlowTokens
      .map(superToken => ({
        ...superToken,
        depletionDate: calculateDepletionDate(
          superToken.balance,
          superToken.netFlow,
          now,
          superToken.lastUpdateDate
        ),
      }))
      .filter(({ depletionDate }) => differenceInDays(depletionDate, now) < WARNING_THRESHOLD_DAYS)
      .sort(({ depletionDate: depletionDateA }, { depletionDate: depletionDateB }) =>
        compareAsc(depletionDateA, depletionDateB)
      );
  }, [incomingFlowTokens]);
  const incomingFlowWarnings = filteredSuperTokens.map(({ address, depletionDate }, index) => {
    const tokenSymbol = superTokens.find(superToken => addressesEqual(superToken.address, address))
      .symbol;

    return (
      <Info
        css={`
          margin-bottom: ${index < filteredSuperTokens.length - 1 ? 2 * GU : 0}px;
        `}
        key={address}
        mode="warning"
      >
        <>
          <span
            css={`
              position: relative;
              top: 7px;
            `}
          >
            <IconWarning />
          </span>
          Your <strong>{tokenSymbol}</strong> balance is going to run out on{' '}
          <strong>
            {format(depletionDate, 'PPPPpp')} (
            {formatDistance(depletionDate, new Date(), { addSuffix: true })}){' '}
          </strong>{' '}
          and all your incoming flows will stop. Get more Super Tokens to keep them open.
        </>
      </Info>
    );
  });
  const firstIncomingWarning = incomingFlowWarnings.shift();

  if (!incomingFlowWarnings.length) {
    return null;
  }

  return (
    <div>
      {firstIncomingWarning}
      {!!incomingFlowWarnings.length && (
        <div
          css={`
            margin: -${2 * GU}px 0;
          `}
        >
          <Details label={`Show all (${incomingFlowWarnings.length})`}>
            {incomingFlowWarnings}
          </Details>
        </div>
      )}
    </div>
  );
};

export default IncomingFlowsWarnings;
