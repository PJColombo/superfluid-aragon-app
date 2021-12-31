import { Button, GU, LoadingRing } from '@aragon/ui';
import React from 'react';

const SubmitButton = ({ panelState, label, disabled }) => {
  const { waitTxPanel } = panelState;

  return (
    <Button
      css={`
        margin-bottom: ${3 * GU}px;
      `}
      mode="strong"
      type="submit"
      disabled={disabled || waitTxPanel}
      wide
    >
      {waitTxPanel && <LoadingRing />} {label}
    </Button>
  );
};

export default SubmitButton;
