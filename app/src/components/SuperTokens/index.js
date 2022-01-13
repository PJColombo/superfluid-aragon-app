import React from 'react';
import { useAppState } from '@aragon/api-react';
import { GU, LoadingRing, textStyle, useLayout, useTheme } from '@aragon/ui';
import useBalanceItems from '../../hooks/useBalanceItems';
import SuperTokenCard from './SuperTokenCard/index';

const SuperTokens = ({ superTokens, onDeposit }) => {
  const { isSyncing } = useAppState();
  const theme = useTheme();
  const { layoutName } = useLayout();
  const balanceItems = useBalanceItems(superTokens);

  const compact = layoutName === 'small';

  return (
    <div
      css={`
        margin: ${4 * GU}px 0;
      `}
    >
      <div
        css={`
          display: flex;
          ${compact && 'justify-content: center'};
          gap: ${2 * GU}px;
          flex-wrap: wrap;
        `}
      >
        {balanceItems.length === 0 ? (
          <div
            css={`
              display: flex;
              width: 100%;
              margin-top: ${5 * GU}px;
              height: ${15 * GU}px;
              justify-content: center;
              ${textStyle('body1')};
              color: ${theme.content};
            `}
          >
            {isSyncing ? (
              <div
                css={`
                  display: flex;
                  gap: ${1 * GU}px;
                `}
              >
                <LoadingRing mode="half-circle" /> Loading super tokens.
              </div>
            ) : (
              'No token balances yet.'
            )}
          </div>
        ) : (
          balanceItems.map(balanceItem => (
            <SuperTokenCard
              key={balanceItem.address}
              width={`${33 * GU}px`}
              item={balanceItem}
              onDeposit={onDeposit}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default SuperTokens;
