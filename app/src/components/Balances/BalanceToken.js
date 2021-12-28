import { useNetwork } from '@aragon/api-react';
import { formatTokenAmount, GU, IconArrowDown, IconArrowUp, textStyle, useTheme } from '@aragon/ui';
import React from 'react';
import { superTokenIconUrl } from '../../helpers';
import DynamicFlowAmount from '../DynamicFlowAmount';

const BalanceToken = ({
  item: {
    address,
    amount,
    compact,
    convertedAmount,
    netFlow,
    lastUpdateDate,
    decimals,
    symbol,
    verified = false,
  },
  showIcon = true,
}) => {
  const theme = useTheme();
  const network = useNetwork();

  return (
    <div css="display: inline-block">
      <div
        title={symbol || 'Unknown symbol'}
        css={`
          display: flex;
          align-items: center;
          color: ${theme.surfaceContentSecondary};
          ${textStyle('body2')}
          font-weight: bold;
        `}
      >
        {showIcon && (
          <img
            alt=""
            width="20"
            height="20"
            src={superTokenIconUrl(address, symbol, network && network.type)}
            css={`
              margin-right: ${0.75 * GU}px;
            `}
          />
        )}
        {symbol || '?'}
      </div>
      <div>
        <div
          css={`
            ${textStyle('title2')}
            margin: ${(compact ? 1 : 1.5) * GU}px 0;
            display: flex;
            align-items: center;
          `}
        >
          {!netFlow.isZero() ? (
            netFlow.isNeg() ? (
              <IconArrowDown color={theme.negative} />
            ) : (
              <IconArrowUp color={theme.positive} />
            )
          ) : null}
          <DynamicFlowAmount baseAmount={amount} rate={netFlow} lastDate={lastUpdateDate}>
            <SplitAmount decimals={decimals} />
          </DynamicFlowAmount>
        </div>
        <div
          css={`
            color: ${theme.surfaceContentSecondary};
            ${textStyle('body2')}
          `}
        >
          {convertedAmount.isNeg()
            ? '−'
            : `$${formatTokenAmount(convertedAmount, decimals, { digits: 6 })}`}
        </div>
      </div>
    </div>
  );
};

function SplitAmount({ dynamicAmount, decimals }) {
  const [integer, fractional] = formatTokenAmount(dynamicAmount, decimals, { digits: 6 }).split(
    '.'
  );

  return (
    <div
      css={`
        display: flex;
      `}
    >
      <span>{integer}</span>
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
}

export default BalanceToken;
