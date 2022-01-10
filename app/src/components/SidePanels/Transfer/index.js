import { GU, SidePanel, Tabs } from '@aragon/ui';
import React, { useState } from 'react';
import BaseSidePanel from '../BaseSidePanel';
import Deposit from './Deposit';
import Withdrawal from './Withdrawal';

const DEFAULT_SELECTED_TAB = 0;

const Transfer = React.memo(({ panelState, superTokens, onDeposit, onWithdraw }) => {
  const [selectedTab, setSelectedTab] = useState(DEFAULT_SELECTED_TAB);

  return (
    <BaseSidePanel disableMargin panelState={panelState} title="Transfer Super Tokens">
      <div
        css={`
          margin: 0 -${SidePanel.HORIZONTAL_PADDING}px ${3 * GU}px;
        `}
      >
        <Tabs items={['Deposit', 'Withdrawal']} selected={selectedTab} onChange={setSelectedTab} />
      </div>
      {selectedTab === 0 ? (
        <Deposit panelState={panelState} superTokens={superTokens} onDeposit={onDeposit} />
      ) : (
        <Withdrawal panelState={panelState} superTokens={superTokens} onWithdraw={onWithdraw} />
      )}
    </BaseSidePanel>
  );
});

export default Transfer;
