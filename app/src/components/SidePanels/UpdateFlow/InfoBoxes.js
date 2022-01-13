import { IdentityBadge } from '@aragon/ui';
import React from 'react';
import styled from 'styled-components';
import { calculateNewFlowRate, fromDecimals, toMonthlyRate } from '../../../helpers';
import InfoBox from '../InfoBox';

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
      open to <IdentityBadge entity={flow.entity} connectedAccount compact />. This amount will be
      added to the current flow for a total of{' '}
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
      {requiredDeposit} {selectedToken.data.symbol}
    </BoldUnderline>{' '}
    from the app agent's balance. The Deposit will be refunded in full when the flow gets close or
    lost if the {selectedToken.data.symbol} balance hits zero with the flow still open.
  </InfoBox>
);

const BoldUnderline = styled.span`
  font-weight: bold;
  text-decoration: underline;
`;
