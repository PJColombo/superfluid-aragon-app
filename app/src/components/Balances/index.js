import React from 'react';
import { useAppState, useNetwork } from '@aragon/api-react';
import { Box, GU, LoadingRing, textStyle, useLayout, useTheme } from '@aragon/ui';
import BalanceToken from './BalanceToken';
import useBalanceItems from '../../hooks/useBalanceItems';

const Balances = ({ superTokens }) => {
  const network = useNetwork();
  const { isSyncing } = useAppState();
  const theme = useTheme();
  const { layoutName } = useLayout();
  const balanceItems = useBalanceItems(superTokens, network);

  const compact = layoutName === 'small';

  return (
    <Box heading="Token Balances" padding={0}>
      <div
        css={`
          padding: ${(compact ? 1 : 2) * GU}px;
        `}
      >
        <div
          css={`
            display: flex;
            align-items: center;
            min-height: ${14 * GU}px;
            overflow-x: auto;
            padding: ${1 * GU}px;
          `}
        >
          {balanceItems.length === 0 ? (
            <div
              css={`
                display: flex;
                width: 100%;
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
                  <LoadingRing /> Loading balances.
                </div>
              ) : (
                'No token balances yet.'
              )}
            </div>
          ) : (
            <ul
              css={`
                list-style: none;
                display: flex;
                ${compact
                  ? `
                    flex-direction: column;
                    padding: ${1 * GU}px 0;
                  `
                  : ''}
              `}
            >
              {balanceItems.map(balanceItem => (
                <li
                  key={balanceItem.address}
                  css={`
                    flex-shrink: 0;
                    display: block;
                    min-width: ${20 * GU}px;
                    padding-right: ${4 * GU}px;
                    ${compact ? `margin-bottom: ${3 * GU}px;` : ''}
                    &:last-of-type {
                      min-width: unset;
                      margin-bottom: 0;
                    }
                  `}
                >
                  <BalanceToken item={balanceItem} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Box>
  );
};

export default Balances;
