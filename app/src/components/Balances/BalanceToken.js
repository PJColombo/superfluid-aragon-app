import { formatTokenAmount, GU, IconArrowDown, IconArrowUp, textStyle, useTheme } from '@aragon/ui';
import React from 'react';
import { DEFAULT_CURRENCY_SYMBOL } from '../../helpers';
import DynamicFlowAmount from '../DynamicFlowAmount';

const BalanceToken = ({
  item: {
    address,
    amount,
    convertedAmount,
    convertedNetFlow,
    logoURI,
    name,
    netFlow,
    lastUpdateDate,
    decimals,
    symbol,
  },
  showIcon = true,
}) => {
  const displayLogo = showIcon && logoURI && logoURI.length;
  const theme = useTheme();

  return (
    <div css="display: inline-block">
      <div
        title={name ? `${name} - ${address}` : `${address}`}
        css={`
          display: flex;
          color: ${theme.surfaceContentSecondary};
          ${textStyle('body2')};
          font-weight: bold;
        `}
      >
        {displayLogo && (
          <img
            alt=""
            width="20"
            height="20"
            src={logoURI}
            css={`
              margin-right: ${0.75 * GU}px;
            `}
          />
        )}
        <div>{symbol || '?'}</div>
        {!netFlow.isZero() ? (
          <div
            css={`
              display: flex;
              align-items: center;
              position: relative;
              top: -3px;
            `}
          >
            {netFlow.isNeg() ? (
              <IconArrowDown color={theme.negative} />
            ) : (
              <IconArrowUp color={theme.positive} />
            )}
          </div>
        ) : null}
      </div>
      <div>
        <div
          css={`
            ${textStyle('title2')};
            margin: ${1 * GU}px 0;
            display: flex;
            align-items: center;
          `}
        >
          <DynamicFlowAmount baseAmount={amount} rate={netFlow} lastDate={lastUpdateDate}>
            <SplitAmount decimals={decimals} />
          </DynamicFlowAmount>
        </div>
        <div
          css={`
            color: ${theme.surfaceContentSecondary};
            ${textStyle('body2')};
          `}
        >
          {!convertedAmount || convertedAmount.isNeg() ? (
            '−'
          ) : (
            <DynamicFlowAmount
              baseAmount={convertedAmount}
              rate={convertedNetFlow}
              lastDate={lastUpdateDate}
            >
              <SplitAmount
                decimals={decimals}
                digitsDisplayed={2}
                prefix={DEFAULT_CURRENCY_SYMBOL}
              />
            </DynamicFlowAmount>
          )}
        </div>
      </div>
    </div>
  );
};

function SplitAmount({ dynamicAmount, decimals, digitsDisplayed = 6, prefix }) {
  const [integer, fractional] = formatTokenAmount(dynamicAmount, decimals, {
    digits: digitsDisplayed,
  }).split('.');

  return (
    <div
      css={`
        display: flex;
      `}
    >
      {prefix}
      <span>{integer}</span>
      {fractional && (
        <div
          css={`
            ${textStyle('body3')};
            min-width: ${8 * GU}px;
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
