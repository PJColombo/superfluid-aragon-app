import React from 'react';
import { Redraw } from '@aragon/ui';
import { BN } from 'ethereumjs-blockchain/node_modules/ethereumjs-util';
import { calculateCurrentSuperTokenBalance } from '../helpers';

const RENDER_EVERY = 1000;

const DynamicFlowAmount = ({ children, baseAmount = new BN(0), rate, lastDate }) => {
  const renderAmount = () => {
    const amount = calculateCurrentSuperTokenBalance(baseAmount, rate, lastDate);

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
