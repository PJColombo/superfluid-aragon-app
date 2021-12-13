import { GU } from '@aragon/ui';
import SidePanel from '@aragon/ui/dist/SidePanel';
import React from 'react';

const BaseSidePanel = ({ title, panelState, children }) => (
  <SidePanel
    title={title}
    opened={panelState.visible}
    onClose={panelState.requestClose}
    onTransitionEnd={panelState.onTransitionEnd}
  >
    <div
      css={`
        margin-top: ${4 * GU}px;
      `}
    >
      {children}
    </div>
  </SidePanel>
);

export default BaseSidePanel;
