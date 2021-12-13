import React from 'react';
import BaseSidePanel from '../BaseSidePanel';

const NewDeposit = React.memo(({ panelState, onNewDeposit }) => {
  return (
    <BaseSidePanel panelState={panelState} title="New Deposit">
      <div>Content</div>
    </BaseSidePanel>
  );
});

export default NewDeposit;
