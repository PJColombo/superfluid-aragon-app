import { GU, SidePanel, Tabs } from '@aragon/ui';
import React, { useState } from 'react';
import BaseSidePanel from '../BaseSidePanel';
import Downgrade from './Downgrade';
import Upgrade from './Upgrade';

const Convert = React.memo(({ panelState, superTokens, onConvert }) => {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <BaseSidePanel disableMargin panelState={panelState} title="Convert Tokens">
      <div
        css={`
          margin: 0 -${SidePanel.HORIZONTAL_PADDING}px ${3 * GU}px;
        `}
      >
        <Tabs items={['Upgrade', 'Downgrade']} selected={selectedTab} onChange={setSelectedTab} />
      </div>
      {selectedTab === 0 ? (
        <Upgrade panelState={panelState} superTokens={superTokens} onConvert={onConvert} />
      ) : (
        <Downgrade panelState={panelState} superTokens={superTokens} onConvert={onConvert} />
      )}
    </BaseSidePanel>
  );
});

export default Convert;
