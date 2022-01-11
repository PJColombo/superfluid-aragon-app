import React from 'react';
import { Redraw } from '@aragon/ui';
import { calculateCurrentAmount, ZERO_BN } from '../helpers';

const RENDER_EVERY = 1000;

const DynamicFlowAmount = ({ children, accumulatedAmount = ZERO_BN, rate, lastDate }) => {
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

  return (
    <div>
      <Redraw interval={RENDER_EVERY}>{renderAmount}</Redraw>
    </div>
  );
};

export default DynamicFlowAmount;
