import { formatTokenAmount, GU, textStyle, useTheme } from '@aragon/ui';
import React from 'react';
import { DEFAULT_CURRENCY_SYMBOL, ZERO_BN } from '../../../helpers';
import DynamicFlowAmount from '../../DynamicFlowAmount';

const Balance = ({
  balance,
  convertedAmount,
  convertedNetFlow,
  decimals,
  lastUpdateDate,
  netFlow,
}) => {
  const theme = useTheme();

  return (
    <React.Fragment>
      <div
        css={`
          ${textStyle('title3')};
          display: flex;
          align-items: center;
        `}
      >
        <DynamicFlowAmount accumulatedAmount={balance} rate={netFlow} lastDate={lastUpdateDate}>
          <SplitAmount decimals={decimals} />
        </DynamicFlowAmount>
      </div>
      <div
        css={`
          color: ${theme.surfaceContentSecondary.alpha(0.6)};
          ${textStyle('body2')};
        `}
      >
        {!convertedAmount || convertedAmount.lt(ZERO_BN) ? (
          '−'
        ) : (
          <DynamicFlowAmount
            accumulatedAmount={convertedAmount}
            rate={convertedNetFlow}
            lastDate={lastUpdateDate}
          >
            <SplitAmount decimals={decimals} digitsDisplayed={2} prefix={DEFAULT_CURRENCY_SYMBOL} />
          </DynamicFlowAmount>
        )}
      </div>
    </React.Fragment>
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
      {dynamicAmount.isNeg() ? (
        0
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}

export default Balance;
