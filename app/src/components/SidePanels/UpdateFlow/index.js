import { useAppState } from '@aragon/api-react';
import { Field, GU, Info } from '@aragon/ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { isAddress } from 'web3-utils';
import { addressPattern, addressesEqual } from '../../../helpers';
import BaseSidePanel from '../BaseSidePanel';
import FlowRateField from './FlowRateField';
import LocalIdentitiesAutoComplete from '../../LocalIdentitiesAutoComplete';
import SubmitButton from '../SubmitButton';
import TokenSelector, { INITIAL_SELECTED_TOKEN } from '../../TokenSelector';

const validateFields = (recipient, flowRate, agentAddress) => {
  if (!isAddress(recipient)) {
    return 'Recipient must be a valid Ethereum address.';
  } else if (addressesEqual(recipient, agentAddress)) {
    return "You can't create a flow to the app's agent.";
  } else if (Number(flowRate) <= 0) {
    return "Flow rate provided can't be negative nor zero.";
  }
};

export default React.memo(({ panelState, superTokens, onUpdateFlow }) => {
  const { agentAddress } = useAppState();
  const [recipient, setRecipient] = useState('');
  const [selectedToken, setSelectedToken] = useState(INITIAL_SELECTED_TOKEN);
  const [flowRate, setFlowRate] = useState('');
  const [errorMessage, setErrorMessage] = useState();
  const recipientInputRef = useRef();
  const { updateSuperTokenAddress, updateRecipient } = panelState.params || {};
  const isFlowUpdate = Boolean(updateSuperTokenAddress && updateRecipient);
  const disableSubmit = Boolean(
    errorMessage ||
      (!recipient && !updateRecipient) ||
      (!selectedToken.address && !updateSuperTokenAddress) ||
      !flowRate
  );
  const displayError = errorMessage && errorMessage.length;

  const clear = () => {
    setRecipient('');
    setSelectedToken(INITIAL_SELECTED_TOKEN);
    setFlowRate('');
    setErrorMessage();
  };

  const findSuperTokenByAddress = address =>
    superTokens.find(superToken => addressesEqual(superToken.address, address));

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

    const error = validateFields(recipient, flowRate, agentAddress);

    if (error && error.length) {
      setErrorMessage(error);
      return;
    }

    if (isFlowUpdate) {
      panelState.requestTransaction(onUpdateFlow, [
        updateSuperTokenAddress,
        updateRecipient,
        flowRate,
      ]);
    } else {
      panelState.requestTransaction(onUpdateFlow, [selectedToken.address, recipient, flowRate]);
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
  }, [panelState.didOpen, isFlowUpdate]);

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
          selectedToken={
            isFlowUpdate ? findSuperTokenByAddress(updateSuperTokenAddress) : selectedToken
          }
          disabled={isFlowUpdate}
          onChange={handleTokenChange}
        />
        <FlowRateField onChange={handleFlowRateChange} />
        <SubmitButton
          panelState={panelState}
          label={isFlowUpdate ? 'Update' : 'Create'}
          disabled={disableSubmit}
        />
      </form>
      {displayError && (
        <Info
          mode="error"
          css={`
            margin-top: ${2 * GU}px;
          `}
        >
          {errorMessage}
        </Info>
      )}
    </BaseSidePanel>
  );
});
