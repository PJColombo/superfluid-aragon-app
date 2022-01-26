import { IdentityBadge } from '@aragon/ui';
import React from 'react';
import styled from 'styled-components';
import { calculateNewFlowRate, fromDecimals, toMonthlyRate } from '../../../helpers';
import InfoBox from '../InfoBox';

export const ExistingFlowInfo = ({
  flow,
  selectedToken,
  flowRate = '0',
  isOutgoingFlow = true,
}) => {
  const currentMonthlyFlowRate = Number(toMonthlyRate(fromDecimals(flow.flowRate)).toFixed(2));
  const newMonthlyFlowRate = Number(toMonthlyRate(calculateNewFlowRate(flow, flowRate)).toFixed(2));
  const tokenSymbol = selectedToken.data.symbol;

  return (
    <InfoBox>
      There is already a flow of{' '}
      <BoldUnderline>
        {currentMonthlyFlowRate} {tokenSymbol}/month
      </BoldUnderline>{' '}
      opened {isOutgoingFlow ? 'to' : 'from'}{' '}
      <IdentityBadge entity={flow.entity} connectedAccount compact />. This amount will be added to
      the current flow for a total of{' '}
      <BoldUnderline>
        {newMonthlyFlowRate} {tokenSymbol}/month.
      </BoldUnderline>
    </InfoBox>
  );
};

export const RequiredDepositInfo = ({ requiredDeposit, selectedToken, isOutgoingFlow = true }) => {
  const formattedRequiredDeposit = Number(requiredDeposit.toFixed(8));

  return (
    <InfoBox mode="warning">
      Starting this flow will take a security Deposit of{' '}
      <BoldUnderline>
        {formattedRequiredDeposit} {selectedToken.data.symbol}
      </BoldUnderline>{' '}
      from {isOutgoingFlow ? "the app Agent's balance" : 'your account'}. The Deposit will be
      refunded in full when the flow gets closed or lost if the {selectedToken.data.symbol} balance
      hits zero with the flow still open.
    </InfoBox>
  );
};

const BoldUnderline = styled.span`
  font-weight: bold;
  text-decoration: underline;
`;
