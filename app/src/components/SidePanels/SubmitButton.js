import { Button, LoadingRing } from '@aragon/ui';
import React from 'react';

const SubmitButton = ({ panelState, label, disabled }) => {
  const { waitTxPanel } = panelState;

  return (
    <Button mode="strong" type="submit" disabled={disabled || waitTxPanel} wide>
      {waitTxPanel && <LoadingRing />} {label}
    </Button>
  );
};

export default SubmitButton;
