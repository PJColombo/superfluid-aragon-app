import { ContextMenuItem, GU, IconEdit, IconRemove, useTheme } from '@aragon/ui';
import React from 'react';

export const ContextMenuDeleteFlow = ({ onDeleteFlow }) => {
  const theme = useTheme();

  return (
    <ContextMenuItem onClick={onDeleteFlow}>
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
        Cancel Flow
      </span>
    </ContextMenuItem>
  );
};

export const ContextMenuUpdateFlow = ({ onUpdateFlow }) => {
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
