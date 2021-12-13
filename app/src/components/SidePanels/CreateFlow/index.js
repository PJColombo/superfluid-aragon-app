import { addressesEqual, Button, Field } from '@aragon/ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import TokenSelector from '../../TokenSelector';
import BaseSidePanel from '../BaseSidePanel';
import ValidationError from '../../ValidationError';
import { addressPattern } from '../../../helpers';
import LocalIdentitiesAutoComplete from '../../LocalIdentitiesAutoComplete';
import { isAddress } from 'web3-utils';
import { useConnectedAccount } from '@aragon/api-react';
import FlowRateField from './FlowRateField';

const NULL_SELECTED_TOKEN = -1;
const INITIAL_TOKEN = {
  address: '',
  index: NULL_SELECTED_TOKEN,
};

export default React.memo(({ panelState, superTokens, onCreateFlow }) => {
  const { connectedAccount } = useConnectedAccount();
  const [recipient, setRecipient] = useState('');
  const [selectedToken, setSelectedToken] = useState(INITIAL_TOKEN);

  const [flowRate, setFlowRate] = useState(0);
  const [errorMessage, setErrorMessage] = useState();
  const recipientInputRef = useRef();
  const disabled = Boolean(
    errorMessage || !recipient || !selectedToken.address || !Number(flowRate)
  );

  const reset = () => {
    setRecipient('');
    setSelectedToken(INITIAL_TOKEN);
    setFlowRate(0);
    setErrorMessage();
  };

  const handleTokenChange = useCallback(
    value => {
      setSelectedToken(value);
      setErrorMessage('');
    },
    [setSelectedToken]
  );

  const handleRecipientChange = useCallback(
    value => {
      setRecipient(value);
      setErrorMessage('');
    },
    [setRecipient]
  );

  const handleFlowRateChange = useCallback(
    value => {
      setFlowRate(value);
      setErrorMessage('');
    },
    [setFlowRate]
  );

  const handleSubmit = async event => {
    event.preventDefault();

    if (!isAddress(recipient)) {
      setErrorMessage('Recipient must be a valid Ethereum address.');
    } else if (addressesEqual(connectedAccount, recipient)) {
      setErrorMessage("You can't create a flow to your own wallet.");
    } else if (flowRate <= 0) {
      setErrorMessage("Flow rate can't be zero.");
    } else {
      onCreateFlow(selectedToken.address, recipient, flowRate);
    }
  };
  // handle reset when opening
  useEffect(() => {
    if (panelState.didOpen) {
      // reset to default values
      // Focus the right input after some time to avoid the panel transition to
      // be skipped by the browser.
      recipientInputRef && setTimeout(() => recipientInputRef.current.focus(), 100);
    }
    return () => {
      reset();
    };
  }, [panelState.didOpen]);

  return (
    <BaseSidePanel title="Create Flow" panelState={panelState}>
      <form onSubmit={handleSubmit}>
        <Field label="Recipient (must be a valid Ethereum address)" css="height: 60px">
          <LocalIdentitiesAutoComplete
            ref={recipientInputRef}
            onChange={handleRecipientChange}
            pattern={
              // Allow spaces to be trimmable
              ` *${addressPattern} *`
            }
            value={recipient}
            required
            wide
          />
        </Field>
        <TokenSelector
          tokens={superTokens}
          selectedIndex={selectedToken.index}
          onChange={handleTokenChange}
        />
        <FlowRateField onChange={handleFlowRateChange} />
        <div
          css={`
            width: 100%;
          `}
        >
          <Button disabled={disabled} mode="strong" type="submit" wide>
            Create
          </Button>
        </div>
        {errorMessage && <ValidationError messages={[errorMessage]} />}
      </form>
    </BaseSidePanel>
  );
});
