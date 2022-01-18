import { Card, GU, IconArrowDown, IconArrowUp, textStyle, useTheme } from '@aragon/ui';
import { differenceInDays } from 'date-fns';
import React, { useCallback } from 'react';
import { fromDecimals, toMonthlyRate, ZERO_BN } from '../../../helpers';
import UnknownTokenLogo from '../../UnknownTokenLogo';
import Balance from './Balance';
import FlowsDistribution from './FlowsDistribution';
import TokenDepletionWarning from './TokenDepletionWarning';

const TOKEN_ICON_SIZE = '25';
const WARNING_DAYS_THRESHOLD = 10;

const SuperTokenCard = React.memo(
  ({
    width,
    item: {
      address,
      amount,
      convertedAmount,
      convertedNetFlow,
      depletionDate,
      logoURI,
      name,
      netFlow,
      inflowRate,
      outflowRate,
      lastUpdateDate,
      decimals,
      symbol,
    },
    onDeposit,
    showIcon = true,
  }) => {
    const theme = useTheme();
    const logoExists = Boolean(logoURI && logoURI.length);
    const displayWarning =
      depletionDate && differenceInDays(depletionDate, new Date()) <= WARNING_DAYS_THRESHOLD;
    const formattedNetFlow = toMonthlyRate(fromDecimals(netFlow.abs(), decimals)).toFixed(2);

    const handleTokenDeposit = useCallback(() => {
      onDeposit({ presetTokenAddress: address });
    }, [address, onDeposit]);

    return (
      <Card
        width={width}
        css={`
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          padding: ${3 * GU}px;
        `}
      >
        <div
          css={`
            width: 100%;
            display: flex;
            justify-content: space-between;
            ${textStyle('body1')};
            margin-bottom: ${1 * GU}px;
          `}
        >
          <div
            css={`
              display: flex;
            `}
          >
            {showIcon && (
              <div
                css={`
                  margin-right: ${0.75 * GU}px;
                `}
              >
                {logoExists ? (
                  <img alt="" width={TOKEN_ICON_SIZE} height={TOKEN_ICON_SIZE} src={logoURI} />
                ) : (
                  <UnknownTokenLogo width={TOKEN_ICON_SIZE} height={TOKEN_ICON_SIZE} />
                )}
              </div>
            )}
            <strong>
              <div title={name ? `${name} - ${address}` : `${address}`}>{symbol || '?'}</div>
            </strong>
            {!netFlow.isZero() && (
              <>
                {netFlow.isNeg() ? (
                  <IconArrowDown color={theme.negative} />
                ) : (
                  <IconArrowUp color={theme.positive} />
                )}
              </>
            )}
          </div>
          {displayWarning && (
            <div
              css={`
                margin-left: ${0.5 * GU}px;
              `}
            >
              <TokenDepletionWarning
                depletionDate={depletionDate}
                size={25}
                onDeposit={handleTokenDeposit}
              />
            </div>
          )}
        </div>
        <Field label="Balance">
          <Balance
            balance={amount}
            convertedAmount={convertedAmount}
            convertedNetFlow={convertedNetFlow}
            decimals={decimals}
            lastUpdateDate={lastUpdateDate}
            netFlow={netFlow}
          />
        </Field>
        <Field label="Monthly Net flow">
          <div
            css={`
              ${!netFlow.eq(ZERO_BN) &&
                `color: ${netFlow.isNeg() ? theme.negative : theme.positive};`}
            `}
          >
            {netFlow.eq(ZERO_BN) ? '' : netFlow.isNeg() ? '-' : '+'}
            {formattedNetFlow}
          </div>
        </Field>
        <Field label="Streaming IN and OUT" headerMargin={1}>
          <FlowsDistribution
            inflowRate={inflowRate}
            outflowRate={outflowRate}
            tokenDecimals={decimals}
          />
        </Field>
      </Card>
    );
  }
);

const Field = ({ children, label, headerMargin = 0.5 }) => {
  const theme = useTheme();

  return (
    <div
      css={`
        width: 100%;
        margin-bottom: ${1 * GU}px;
      `}
    >
      <div
        css={`
          ${textStyle('label2')};
          color: ${theme.surfaceContent};
          margin-bottom: ${headerMargin * GU}px;
        `}
      >
        <strong>{label}</strong>
      </div>
      <div
        css={`
          color: ${theme.surfaceContentSecondary};
        `}
      >
        {children}
      </div>
    </div>
  );
};

export default SuperTokenCard;
