import { ContextMenuItem, GU, IconEdit, IconRemove, useTheme } from '@aragon/ui';
import React from 'react';

const BaseContextMenuItem = ({ icon, label }) => {
  const theme = useTheme();

  return (
    <div
      css={`
        display: flex;
        align-items: center;
        position: relative;
      `}
    >
      {icon && (
        <div
          css={`
            position: relative;
            top: 2px;
            color: ${theme.surfaceContentSecondary};
          `}
        >
          {icon}
        </div>
      )}
      <span
        css={`
          margin-left: ${0.5 * GU}px;
        `}
      >
        {label}
      </span>
    </div>
  );
};

export const ContextMenuDeleteFlow = ({ onDeleteFlow }) => (
  <ContextMenuItem onClick={onDeleteFlow}>
    <BaseContextMenuItem icon={<IconRemove />} label="Cancel Flow" />
  </ContextMenuItem>
);

export const ContextMenuUpdateFlow = ({ onUpdateFlow }) => (
  <ContextMenuItem onClick={onUpdateFlow}>
    <BaseContextMenuItem icon={<IconEdit />} label="Update Flow" />
  </ContextMenuItem>
);
