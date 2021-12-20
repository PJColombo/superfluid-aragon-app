import { addressesEqual, Button, Field, LoadingRing } from '@aragon/ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import TokenSelector from '../../TokenSelector';
import BaseSidePanel from '../BaseSidePanel';
import ValidationError from '../../ValidationError';
import { addressPattern } from '../../../helpers';
import LocalIdentitiesAutoComplete from '../../LocalIdentitiesAutoComplete';
import { isAddress } from 'web3-utils';
import { useAppState } from '@aragon/api-react';
import FlowRateField from './FlowRateField';

const NULL_SELECTED_TOKEN = -1;
const INITIAL_TOKEN = {
  address: '',
  index: NULL_SELECTED_TOKEN,
};

export default React.memo(({ panelState, superTokens, onUpdateFlow }) => {
  const { agentAddress } = useAppState();
  const [recipient, setRecipient] = useState('');
  const [selectedToken, setSelectedToken] = useState(INITIAL_TOKEN);
  const [flowRate, setFlowRate] = useState(0);
  const [errorMessage, setErrorMessage] = useState();
  const recipientInputRef = useRef();
  const { updateSuperTokenAddress, updateRecipient } = panelState.params || {};
  const isFlowUpdate = Boolean(updateSuperTokenAddress && updateRecipient);
  const disableSubmit = Boolean(
    errorMessage ||
      (!recipient && !updateRecipient) ||
      (!selectedToken.address && !updateSuperTokenAddress) ||
      !Number(flowRate) ||
      panelState.waitTxPanel
  );

  const clear = () => {
    setRecipient('');
    setSelectedToken(INITIAL_TOKEN);
    setFlowRate(0);
    setErrorMessage();
  };

  const findSuperTokenIndexByAddress = address =>
    superTokens.findIndex(superToken => addressesEqual(superToken.address, address));

  const handleTokenChange = useCallback(value => {
    setSelectedToken(value);
    setErrorMessage('');
  }, []);

  const handleRecipientChange = useCallback(value => {
    setRecipient(value);
    setErrorMessage('');
  }, []);

  const handleFlowRateChange = useCallback(value => {
    setFlowRate(value);
    setErrorMessage('');
  }, []);

  const handleSubmit = async event => {
    event.preventDefault();

    if (flowRate <= 0) {
      setErrorMessage("Flow rate can't be zero.");
    }

    if (isFlowUpdate) {
      panelState.requestTransaction(onUpdateFlow, [
        updateSuperTokenAddress,
        updateRecipient,
        flowRate,
      ]);
    } else {
      if (!isAddress(recipient)) {
        setErrorMessage('Recipient must be a valid Ethereum address.');
      } else if (addressesEqual(agentAddress, recipient)) {
        setErrorMessage("You can't create a flow to the app's agent.");
      } else {
        panelState.requestTransaction(onUpdateFlow, [selectedToken.address, recipient, flowRate]);
      }
    }
  };
  // handle reset when opening
  useEffect(() => {
    if (panelState.didOpen && !isFlowUpdate) {
      // reset to default values
      // Focus the right input after some time to avoid the panel transition to
      // be skipped by the browser.
      recipientInputRef && setTimeout(() => recipientInputRef.current.focus(), 100);
    }
    return () => {
      clear();
    };
  }, [panelState.didOpen]);

  return (
    <BaseSidePanel title={isFlowUpdate ? 'Update Flow' : 'Create Flow'} panelState={panelState}>
      <form onSubmit={handleSubmit}>
        <Field
          label="Recipient (must be a valid Ethereum address)"
          css={`
            height: 60px;
            ${isFlowUpdate && 'pointer-events: none;'}
          `}
        >
          <LocalIdentitiesAutoComplete
            ref={recipientInputRef}
            onChange={handleRecipientChange}
            pattern={
              // Allow spaces to be trimmable
              ` *${addressPattern} *`
            }
            value={isFlowUpdate ? updateRecipient : recipient}
            required
            wide
          />
        </Field>
        <TokenSelector
          tokens={superTokens}
          selectedIndex={
            isFlowUpdate
              ? findSuperTokenIndexByAddress(updateSuperTokenAddress)
              : selectedToken.index
          }
          disabled={isFlowUpdate}
          onChange={handleTokenChange}
        />
        <FlowRateField onChange={handleFlowRateChange} />
        <Button disabled={disableSubmit} mode="strong" type="submit" wide>
          {panelState.waitTxPanel && <LoadingRing />} {isFlowUpdate ? 'Update' : 'Create'}
        </Button>
        {errorMessage && <ValidationError messages={[errorMessage]} />}
      </form>
    </BaseSidePanel>
  );
});
