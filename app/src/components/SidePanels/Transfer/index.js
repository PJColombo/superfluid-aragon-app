import { GU, SidePanel, Tabs } from '@aragon/ui';
import React, { useState } from 'react';
import BaseSidePanel from '../BaseSidePanel';

const Transfer = React.memo(({ panelState, onTransfer }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  return (
    <BaseSidePanel disableMargin panelState={panelState} title="Transfer Super Tokens">
      <div
        css={`
          margin: 0 -${SidePanel.HORIZONTAL_PADDING}px ${3 * GU}px;
        `}
      >
        <Tabs items={['Deposit', 'Withdraw']} selected={selectedTab} onChange={setSelectedTab} />
      </div>
    </BaseSidePanel>
  );
});

export default Transfer;
