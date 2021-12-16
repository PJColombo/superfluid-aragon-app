import React from 'react';
import { Redraw } from '@aragon/ui';
import { BN } from 'ethereumjs-blockchain/node_modules/ethereumjs-util';
import { getCurrentTimestamp } from '../helpers';

const RENDER_EVERY = 1000;

const getAmount = (baseAmount, rate, lastTimestamp) => {
  return baseAmount.add(rate.mul(new BN(getCurrentTimestamp() - lastTimestamp)));
};

const DynamicFlowAmount = ({ children, baseAmount = new BN(0), rate, lastTimestamp }) => {
  const renderAmount = () => {
    const amount = getAmount(baseAmount, rate, lastTimestamp);

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
