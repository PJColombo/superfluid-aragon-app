import React from 'react';
import { useAppState } from '@aragon/api-react';
import { GU, LoadingRing, textStyle, useLayout, useTheme } from '@aragon/ui';
import useSuperTokenItems from '../../hooks/useSuperTokenItems';
import SuperTokenCard from './SuperTokenCard/index';
import Carousel from './Carousel';

const SuperTokens = ({ superTokens, onDeposit }) => {
  const { isSyncing } = useAppState();
  const theme = useTheme();
  const { layoutName } = useLayout();
  const superTokenItems = useSuperTokenItems(superTokens);

  const compact = layoutName === 'small';

  return (
    <div
      css={`
        margin: ${4 * GU}px 0;
      `}
    >
      {superTokenItems.length === 0 ? (
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
                align-items: center;
                gap: ${1 * GU}px;
              `}
            >
              <LoadingRing mode="half-circle" /> Loading super tokens.
            </div>
          ) : (
            'No super tokens yet.'
          )}
        </div>
      ) : (
        <Carousel
          items={superTokenItems.map((balanceItem, index) => (
            <SuperTokenCard
              key={`${balanceItem.address}${index}`}
              item={balanceItem}
              onDeposit={onDeposit}
            />
          ))}
          compactMode={compact}
          customSideSpace={4 * GU}
          itemHeight={43 * GU}
          // Card's default content size + l&r padding + l&r marging
          itemWidth={230 + 2 * 3 * GU + 1 * GU}
          itemSpacing={2 * GU}
        />
      )}
    </div>
  );
};

export default SuperTokens;
