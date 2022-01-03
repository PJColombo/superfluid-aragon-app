import { formatTokenAmount, IdentityBadge } from '@aragon/ui';
import React from 'react';
import styled from 'styled-components';
import { calculateNewFlowRate, fromDecimals, MONTH } from '../../../helpers';
import InfoBox from '../InfoBox';

const toMonthlyRate = flowRate => {
  return flowRate * MONTH;
};

export const ExistingFlowInfo = ({ flow, selectedToken, flowRate = '0' }) => {
  const currentMonthlyFlowRate = toMonthlyRate(fromDecimals(flow.flowRate)).toFixed(2);
  const newMonthlyFlowRate = toMonthlyRate(calculateNewFlowRate(flow, flowRate)).toFixed(2);
  const tokenSymbol = selectedToken.data.symbol;

  return (
    <InfoBox>
      There is already a flow of{' '}
      <BoldUnderline>
        {currentMonthlyFlowRate} {tokenSymbol}/month
      </BoldUnderline>{' '}
      open to <IdentityBadge entity={flow.entity} connectedAccount compact />. We will add this
      amount to the flow for a total of{' '}
      <BoldUnderline>
        {newMonthlyFlowRate} {tokenSymbol}/month.
      </BoldUnderline>
    </InfoBox>
  );
};

export const RequiredDepositInfo = ({ requiredDeposit, selectedToken }) => (
  <InfoBox mode="warning">
    Starting this flow will take a security Deposit of{' '}
    <BoldUnderline>
      {formatTokenAmount(requiredDeposit, selectedToken.data.decimals, { digits: 6 })}{' '}
      {selectedToken.data.symbol}
    </BoldUnderline>{' '}
    from the app agent's balance. The Deposit will be refunded in full when the flow gets close or
    lost if the {selectedToken.data.symbol} balance hits zero with the flow still open.
  </InfoBox>
);

const BoldUnderline = styled.span`
  font-weight: bold;
  text-decoration: underline;
`;
