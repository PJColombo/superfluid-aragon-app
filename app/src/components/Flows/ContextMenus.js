import { ContextMenuItem, GU, IconEdit, IconRemove, useTheme } from '@aragon/ui';
import React from 'react';

export const ContextMenuDeleteFlow = ({ onRemoveFlow }) => {
  const theme = useTheme();

  return (
    <ContextMenuItem onClick={onRemoveFlow}>
      <IconRemove
        css={`
          color: ${theme.surfaceContentSecondary};
        `}
      />
      <span
        css={`
          margin-left: ${1 * GU}px;
        `}
      >
        Remove Flow
      </span>
    </ContextMenuItem>
  );
};

export const ContextMenuUpdateFlow = ({ onRemoveFlow: onUpdateFlow }) => {
  const theme = useTheme();

  return (
    <ContextMenuItem onClick={onUpdateFlow}>
      <IconEdit
        css={`
          color: ${theme.surfaceContentSecondary};
        `}
      />
      <span
        css={`
          margin-left: ${1 * GU}px;
        `}
      >
        Update Flow
      </span>
    </ContextMenuItem>
  );
};
