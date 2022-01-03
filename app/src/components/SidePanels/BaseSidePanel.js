import React from 'react';
import { GU, SidePanel } from '@aragon/ui';

const BaseSidePanel = ({ title, panelState, disableMargin = false, children }) => {
  return (
    <SidePanel
      title={title}
      opened={panelState.visible}
      onClose={panelState.requestClose}
      onTransitionEnd={panelState.onTransitionEnd}
    >
      <div
        css={`
          margin-top: ${disableMargin ? 0 : 4 * GU}px;
        `}
      >
        {children}
      </div>
    </SidePanel>
  );
};

export default BaseSidePanel;
