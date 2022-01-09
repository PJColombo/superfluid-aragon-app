import { formatTokenAmount, GU, IconArrowDown, IconArrowUp, textStyle, useTheme } from '@aragon/ui';
import { differenceInDays } from 'date-fns';
import React, { useCallback } from 'react';
import styled from 'styled-components';
import { DEFAULT_CURRENCY_SYMBOL } from '../../helpers';
import DynamicFlowAmount from '../DynamicFlowAmount';
import TokenDepletionWarning from './TokenDepletionWarning';

const TOKEN_ICON_SIZE = '25';
const WARNING_DAYS_THRESHOLD = 10;

const BalanceToken = ({
  item: {
    address,
    amount,
    convertedAmount,
    convertedNetFlow,
    depletionDate,
    logoURI,
    name,
    netFlow,
    lastUpdateDate,
    decimals,
    symbol,
  },
  onDeposit,
  showIcon = true,
}) => {
  const theme = useTheme();
  const displayLogo = showIcon && logoURI && logoURI.length;
  const displayWarning =
    depletionDate && differenceInDays(depletionDate, new Date()) <= WARNING_DAYS_THRESHOLD;

  const handleTokenDeposit = useCallback(() => {
    onDeposit({ presetTokenAddress: address });
  }, [address, onDeposit]);

  return (
    <div css="display: inline-block">
      <div
        css={`
          display: flex;
          align-items: center;
          color: ${theme.surfaceContentSecondary};
          ${textStyle('body2')};
          font-weight: bold;
        `}
      >
        {displayLogo && (
          <img
            alt=""
            width={TOKEN_ICON_SIZE}
            height={TOKEN_ICON_SIZE}
            src={logoURI}
            css={`
              margin-right: ${0.75 * GU}px;
            `}
          />
        )}
        <div title={name ? `${name} - ${address}` : `${address}`}>{symbol || '?'}</div>
        {displayWarning ? (
          <IconWrapper
            css={`
              margin-left: ${0.5 * GU}px;
            `}
          >
            <TokenDepletionWarning
              depletionDate={depletionDate}
              size={20}
              onDeposit={handleTokenDeposit}
            />
          </IconWrapper>
        ) : (
          !netFlow.isZero() && (
            <IconWrapper>
              {netFlow.isNeg() ? (
                <IconArrowDown color={theme.negative} />
              ) : (
                <IconArrowUp color={theme.positive} />
              )}
            </IconWrapper>
          )
        )}
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

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  top: -3px;
`;

export default BalanceToken;
