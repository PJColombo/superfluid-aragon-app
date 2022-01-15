import React from 'react';
import { Redraw } from '@aragon/ui';
import { calculateCurrentAmount, ZERO_BN } from '../helpers';

const RENDER_EVERY = 1000;

const DynamicFlowAmount = ({ index, children, accumulatedAmount = ZERO_BN, rate, lastDate }) => {
  const displayDynamicAmount = !rate.eq(ZERO_BN);
  const renderAmount = () => {
    const amount = calculateCurrentAmount(accumulatedAmount, rate, lastDate);
    return (
      <>
        {React.Children.map(children, child =>
          React.cloneElement(child, { dynamicAmount: amount })
        )}
      </>
    );
  };

  return displayDynamicAmount ? (
    <Redraw interval={RENDER_EVERY}>{renderAmount}</Redraw>
  ) : (
    <div>{renderAmount()}</div>
  );
};

export default DynamicFlowAmount;
