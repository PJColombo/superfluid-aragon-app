import { GU, SidePanel, Tabs } from '@aragon/ui';
import React, { useMemo, useState } from 'react';
import { getAvailableSuperTokens } from '../../../helpers';
import BaseSidePanel from '../BaseSidePanel';
import Deposit from './Deposit';
import Withdrawal from './Withdrawal';

const DEFAULT_SELECTED_TAB = 0;

const Transfer = React.memo(({ panelState, superTokens, onDeposit, onWithdraw }) => {
  const [selectedTab, setSelectedTab] = useState(DEFAULT_SELECTED_TAB);
  const availableSuperTokens = useMemo(() => getAvailableSuperTokens(superTokens), [superTokens]);
  const tabs = availableSuperTokens.length ? ['Deposit', 'Withdrawal'] : ['Deposit'];

  return (
    <BaseSidePanel disableMargin panelState={panelState} title="Transfer Super Tokens">
      <div
        css={`
          margin: 0 -${SidePanel.HORIZONTAL_PADDING}px ${3 * GU}px;
        `}
      >
        <Tabs items={tabs} selected={selectedTab} onChange={setSelectedTab} />
      </div>
      {selectedTab === 0 ? (
        <Deposit panelState={panelState} superTokens={superTokens} onDeposit={onDeposit} />
      ) : (
        <Withdrawal
          panelState={panelState}
          superTokens={availableSuperTokens}
          onWithdraw={onWithdraw}
        />
      )}
    </BaseSidePanel>
  );
});

export default Transfer;
