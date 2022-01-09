import { useAppState } from '@aragon/api-react';
import { Field } from '@aragon/ui';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isAddress } from 'web3-utils';
import { addressPattern, addressesEqual, toDecimals, calculateNewFlowRate } from '../../../helpers';
import useDebounce from '../../../hooks/useDebounce';
import BaseSidePanel from '../BaseSidePanel';
import FlowRateField from './FlowRateField';
import LocalIdentitiesAutoComplete from '../../LocalIdentitiesAutoComplete';
import SubmitButton from '../SubmitButton';
import TokenSelector, { INITIAL_SELECTED_TOKEN } from '../../TokenSelector';
import InfoBox from '../InfoBox';
import { ExistingFlowInfo, RequiredDepositInfo } from './InfoBoxes';

const DEBOUNCE_TIME = 500;

const isFlowRateTooBigError = errorMessage =>
  errorMessage.includes('revert CFA: flow rate too big');

const validateFields = (recipient, flowRate, agentAddress) => {
  if (!isAddress(recipient)) {
    return 'Recipient must be a valid Ethereum address.';
  } else if (addressesEqual(recipient, agentAddress)) {
    return "You can't create a flow to the app's agent.";
  } else if (Number(flowRate) <= 0) {
    return "Flow rate provided can't be negative nor zero.";
  }
};

const findSuperTokenByAddress = (address, superTokens) => {
  const index = superTokens.findIndex(superToken => addressesEqual(superToken.address, address));
  const superToken = superTokens[index];

  return {
    index,
    address: superToken.address,
    data: { decimals: superToken.decimals, name: superToken.name, symbol: superToken.symbol },
  };
};

const InnerUpdateFlow = ({ cfa, panelState, flows, superTokens, onUpdateFlow }) => {
  const [recipient, setRecipient] = useState('');
  const [selectedToken, setSelectedToken] = useState(INITIAL_SELECTED_TOKEN);
  const [flowRate, setFlowRate] = useState('');
  const [requiredDeposit, setRequiredDeposit] = useState();
  const [errorMessage, setErrorMessage] = useState();
  const recipientInputRef = useRef();
  const { agentAddress } = useAppState();
  const debouncedFlowRate = useDebounce(flowRate, DEBOUNCE_TIME);

  const { presetSuperTokenAddress, presetRecipient } = panelState.presetParams || {};
  const isFlowUpdateOperation = Boolean(presetSuperTokenAddress && presetRecipient);
  const disableSubmit = Boolean(
    errorMessage ||
      (!recipient && !presetRecipient) ||
      (!selectedToken.address && !presetSuperTokenAddress) ||
      !flowRate
  );
  const displayError = errorMessage && errorMessage.length;
  const existingFlow = useMemo(() => {
    if (isFlowUpdateOperation || !isAddress(recipient) || !isAddress(selectedToken.address)) {
      return null;
    }

    const flowIndex = flows.findIndex(
      ({ isCancelled, isIncoming, entity, superTokenAddress }) =>
        !isCancelled &&
        !isIncoming &&
        addressesEqual(entity, recipient) &&
        addressesEqual(superTokenAddress, selectedToken.address)
    );

    return flows[flowIndex];
  }, [flows, isFlowUpdateOperation, recipient, selectedToken.address]);
  const displayFlowExists = existingFlow && Number(flowRate) > 0;

  const clear = () => {
    setRecipient('');
    setRequiredDeposit();
    setSelectedToken(INITIAL_SELECTED_TOKEN);
    setFlowRate('');
    setErrorMessage();
  };

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

    const newFlowRate = existingFlow
      ? calculateNewFlowRate(existingFlow, flowRate).toString()
      : flowRate;
    const adjustedFlowRate = toDecimals(newFlowRate, selectedToken.decimals);

    panelState.requestTransaction(onUpdateFlow, [
      selectedToken.address,
      recipient,
      adjustedFlowRate,
    ]);
  };

  useEffect(() => {
    return () => {
      clear();
    };
  }, []);

  // Handle reset when opening.
  useEffect(() => {
    if (panelState.didOpen && !isFlowUpdateOperation) {
      // reset to default values
      // Focus the right input after some time to avoid the panel transition to
      // be skipped by the browser.
      recipientInputRef && setTimeout(() => recipientInputRef.current.focus(), 100);
    }
  }, [isFlowUpdateOperation, panelState.didOpen]);

  // Set up preset params.
  useEffect(() => {
    if (!presetSuperTokenAddress || !presetRecipient) {
      return;
    }

    setRecipient(presetRecipient);
    setSelectedToken(findSuperTokenByAddress(presetSuperTokenAddress, superTokens));
  }, [presetRecipient, presetSuperTokenAddress, superTokens]);

  useEffect(() => {
    const fetchDepositRequeriment = async (superTokenAddress, flowRate) => {
      try {
        const adjustedFlowRate = toDecimals(flowRate);
        const flowDeposit = await cfa
          .getDepositRequiredForFlowRate(superTokenAddress, adjustedFlowRate)
          .toPromise();

        setRequiredDeposit(flowDeposit);
      } catch (err) {
        console.error(err);
        if (isFlowRateTooBigError(err.message)) {
          setErrorMessage('The flow rate provided is too big.');
        }
      }
    };

    if (!selectedToken.address || !debouncedFlowRate || Number(debouncedFlowRate) <= 0) {
      return;
    }

    fetchDepositRequeriment(selectedToken.address, debouncedFlowRate);
  }, [cfa, debouncedFlowRate, selectedToken.address]);

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Field
          css={`
            height: 60px;
            ${isFlowUpdateOperation && 'pointer-events: none;'}
          `}
          label="Recipient (must be a valid Ethereum address)"
        >
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
          selectedToken={selectedToken}
          disabled={isFlowUpdateOperation}
          onChange={handleTokenChange}
        />
        <FlowRateField onChange={handleFlowRateChange} />
        <SubmitButton
          panelState={panelState}
          label={isFlowUpdateOperation || !!displayFlowExists ? 'Update' : 'Create'}
          disabled={disableSubmit}
        />
      </form>
      {displayError && <InfoBox mode="error">{errorMessage}</InfoBox>}
      {displayFlowExists && (
        <ExistingFlowInfo flow={existingFlow} selectedToken={selectedToken} flowRate={flowRate} />
      )}
      {requiredDeposit && (
        <RequiredDepositInfo requiredDeposit={requiredDeposit} selectedToken={selectedToken} />
      )}
    </>
  );
};

const UpdateFlow = React.memo(({ ...props }) => {
  const { panelState } = props;
  const { updateSuperTokenAddress, updateRecipient } = panelState.presetParams || {};
  const isFlowUpdateOperation = Boolean(updateSuperTokenAddress && updateRecipient);

  return (
    <BaseSidePanel
      title={isFlowUpdateOperation ? 'Update Flow' : 'Create Flow'}
      panelState={panelState}
    >
      <InnerUpdateFlow {...props} />
    </BaseSidePanel>
  );
});

export default UpdateFlow;
