import { useAppState, useConnectedAccount } from '@aragon/api-react';
import { DropDown, Field } from '@aragon/ui';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Web3EthAbi from 'web3-eth-abi';
import { isAddress } from 'web3-utils';
import {
  addressPattern,
  addressesEqual,
  toDecimals,
  calculateNewFlowRate,
  calculateCurrentAmount,
  calculateRequiredDeposit,
  fromDecimals,
  getAvailableSuperTokens,
} from '../../../helpers';
import BaseSidePanel from '../BaseSidePanel';
import FlowRateField from './FlowRateField';
import LocalIdentitiesAutoComplete from '../../LocalIdentitiesAutoComplete';
import SubmitButton from '../SubmitButton';
import TokenSelector, { INITIAL_SELECTED_TOKEN } from '../TokenSelector';
import InfoBox from '../InfoBox';
import { ExistingFlowInfo, RequiredDepositInfo } from './InfoBoxes';
import SuperTokensLink from '../SuperTokensLink';
import TextInput from '@aragon/ui/dist/TextInput';

const validateFields = (
  superToken,
  recipient,
  flowRate,
  agentAddress,
  requiredDeposit,
  userBalance,
  isOutgoingFlow,
  isCustomToken
) => {
  if (!isAddress(recipient)) {
    return 'Recipient must be a valid Ethereum address.';
  } else if (isOutgoingFlow && addressesEqual(recipient, agentAddress)) {
    return "You can't create a flow to the app's agent.";
  } else if (Number(flowRate) <= 0) {
    return "Flow rate provided can't be negative nor zero.";
  } else {
    let currentBalance, decimals, symbol;

    if (!isCustomToken) {
      const {
        balance,
        decimals: stDecimals,
        netFlow,
        symbol: stSymbol,
        lastUpdateDate,
      } = superToken;

      currentBalance = isOutgoingFlow
        ? calculateCurrentAmount(balance, netFlow, lastUpdateDate)
        : userBalance;

      decimals = stDecimals;
      symbol = stSymbol;
    } else {
      const data = superToken.data;

      currentBalance = userBalance;
      decimals = data.decimals;
      symbol = data.symbol;
    }

    if (fromDecimals(currentBalance, decimals) < requiredDeposit) {
      return `Required deposit exceeds current ${symbol} balance.`;
    }
  }
};

const findSuperTokenByAddress = (address, superTokens) => {
  const index = superTokens.findIndex(superToken => addressesEqual(superToken.address, address));
  const superToken = superTokens[index];

  return {
    index,
    address: superToken.address,
    data: { decimals: superToken.decimals, name: superToken.name, symbol: superToken.symbol },
    loadingData: superToken.isIncoming,
  };
};

const InnerUpdateFlow = ({ panelState, flows, superTokens: allSuperTokens, onUpdateFlow }) => {
  const availableSuperTokens = useMemo(() => getAvailableSuperTokens(allSuperTokens), [
    allSuperTokens,
  ]);
  const { agentAddress } = useAppState();
  const connectedAccount = useConnectedAccount();
  const recipientInputRef = useRef();
  const flowRateInputRef = useRef();
  const [selectedFlowType, setSelectedFlowType] = useState(availableSuperTokens.length ? 1 : 0);
  const [recipient, setRecipient] = useState('');
  const [selectedToken, setSelectedToken] = useState(INITIAL_SELECTED_TOKEN);
  const [flowRate, setFlowRate] = useState('0');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState();
  const outgoingFlowSelected = selectedFlowType === 1;
  const superTokens = outgoingFlowSelected ? availableSuperTokens : allSuperTokens;
  const { presetDescription, presetFlowTypeIndex, presetSuperTokenAddress, presetRecipient } =
    panelState.presetParams || {};
  const requiredDeposit =
    selectedToken.index >= 0
      ? calculateRequiredDeposit(
          flowRate,
          superTokens[selectedToken.index].liquidationPeriodSeconds
        )
      : null;
  const isFlowUpdateOperation = Boolean(presetSuperTokenAddress && presetRecipient);
  const disableSubmit = Boolean(
    errorMessage ||
      (!recipient && !presetRecipient) ||
      (!selectedToken.address && !presetSuperTokenAddress) ||
      flowRate === '0'
  );
  const displayError = errorMessage && errorMessage.length;

  const existingFlow = useMemo(() => {
    if (isFlowUpdateOperation || !isAddress(recipient) || !isAddress(selectedToken.address)) {
      return null;
    }

    const flowIndex = flows.findIndex(
      f =>
        !f.isCancelled &&
        (outgoingFlowSelected ? !f.isIncoming : f.isIncoming) &&
        addressesEqual(f.entity, outgoingFlowSelected ? recipient : connectedAccount) &&
        addressesEqual(f.superTokenAddress, selectedToken.address)
    );

    return flows[flowIndex];
  }, [
    connectedAccount,
    flows,
    isFlowUpdateOperation,
    outgoingFlowSelected,
    recipient,
    selectedToken.address,
  ]);

  const clear = () => {
    setSelectedFlowType(1);
    setRecipient('');
    setSelectedToken({ ...INITIAL_SELECTED_TOKEN });
    setFlowRate('0');
    setDescription('');
    setErrorMessage();
  };

  const handleFlowTypeChange = useCallback(
    index => {
      // Incoming flows have the Agent as the recipient.
      if (index === 0) {
        setRecipient(agentAddress);
      } else {
        setRecipient('');
      }
      /**
       * There may not be the same super tokens for both incoming and outgoing flows
       * so let's clear the selector.
       */
      setSelectedToken({ ...INITIAL_SELECTED_TOKEN });
      setSelectedFlowType(index);
      setErrorMessage('');
    },
    [agentAddress]
  );

  const handleRecipientChange = useCallback(value => {
    setRecipient(value);
    setErrorMessage('');
  }, []);

  const handleTokenChange = useCallback(value => {
    setSelectedToken(value);
    setErrorMessage('');
  }, []);

  const handleFlowRateChange = useCallback(value => {
    setFlowRate(value);
    setErrorMessage('');
  }, []);

  const handleDescriptionChange = useCallback(({ target: { value } }) => {
    setDescription(value);
    setErrorMessage('');
  }, []);

  const handleSubmit = async event => {
    event.preventDefault();
    const isCustomToken = selectedToken.index === -1;
    const userBalance = selectedToken.data.userBalance;

    const error = validateFields(
      isCustomToken ? selectedToken : superTokens[selectedToken.index],
      recipient,
      flowRate,
      agentAddress,
      requiredDeposit,
      userBalance,
      outgoingFlowSelected,
      isCustomToken
    );

    if (error && error.length) {
      setErrorMessage(error);
      return;
    }

    const newFlowRate = calculateNewFlowRate(existingFlow, flowRate);
    const adjustedFlowRate = toDecimals(newFlowRate, selectedToken.data.decimals);
    const encodedDescription = description.length
      ? Web3EthAbi.encodeParameter('string', description)
      : null;

    panelState.requestTransaction(onUpdateFlow, [
      selectedToken.address,
      recipient,
      adjustedFlowRate,
      encodedDescription,
      outgoingFlowSelected,
      !isFlowUpdateOperation && !existingFlow,
    ]);
  };

  useEffect(() => {
    return () => {
      clear();
    };
  }, []);

  // Handle reset when opening.
  useEffect(() => {
    if (!panelState.didOpen) {
      return;
    }

    const inputRef = isFlowUpdateOperation ? flowRateInputRef : recipientInputRef;

    // reset to default values
    // Focus the right input after some time to avoid the panel transition to
    // be skipped by the browser.
    inputRef && setTimeout(() => inputRef.current.focus(), 100);
  }, [isFlowUpdateOperation, panelState.didOpen]);

  // Set up preset params.
  useEffect(() => {
    if (!presetSuperTokenAddress || !presetRecipient) {
      return;
    }
    const fetchedToken = findSuperTokenByAddress(presetSuperTokenAddress, superTokens);
    // Fetch user's Super Token balance when we're updating an incoming flow
    if (presetFlowTypeIndex === 0) {
      fetchedToken.loadingData = true;
    }

    setSelectedFlowType(presetFlowTypeIndex);
    setRecipient(presetRecipient);
    setSelectedToken(fetchedToken);
    setDescription(presetDescription);
  }, [
    presetDescription,
    presetFlowTypeIndex,
    presetRecipient,
    presetSuperTokenAddress,
    superTokens,
  ]);

  useEffect(() => {
    if (isFlowUpdateOperation) {
      return;
    }

    if (!existingFlow) {
      setDescription('');
      return;
    }

    setDescription(existingFlow.description);
  }, [existingFlow, isFlowUpdateOperation]);

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Field label="Flow Type" required>
          <DropDown
            header="Flow Type"
            items={['Incoming', 'Outgoing']}
            selected={selectedFlowType}
            onChange={handleFlowTypeChange}
            disabled={isFlowUpdateOperation || !availableSuperTokens.length}
            wide
          />
        </Field>
        {outgoingFlowSelected && (
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
        )}
        <TokenSelector
          tokens={superTokens}
          selectedToken={selectedToken}
          disabled={isFlowUpdateOperation}
          onChange={handleTokenChange}
          allowCustomToken={!outgoingFlowSelected}
          loadUserBalance={!outgoingFlowSelected}
        />
        <Field label="Description (optional)">
          <TextInput value={description} onChange={handleDescriptionChange} wide />
        </Field>
        <FlowRateField ref={flowRateInputRef} onChange={handleFlowRateChange} />
        <SubmitButton
          panelState={panelState}
          label={isFlowUpdateOperation || !!existingFlow ? 'Update' : 'Create'}
          disabled={disableSubmit}
        />
      </form>
      {displayError && <InfoBox mode="error">{errorMessage}</InfoBox>}
      {!isFlowUpdateOperation && (
        <InfoBox>
          {outgoingFlowSelected ? (
            <>
              By creating an <strong>Outgoing Flow</strong>, the app will stream <SuperTokensLink />{' '}
              from itself to the provided recipient account.
            </>
          ) : (
            <>
              By creating an <strong>Incoming Flow</strong>, you will stream <SuperTokensLink />{' '}
              from your account to the app.
            </>
          )}
        </InfoBox>
      )}
      {!!existingFlow && (
        <ExistingFlowInfo
          flow={existingFlow}
          selectedToken={selectedToken}
          flowRate={flowRate}
          isOutgoingFlow={outgoingFlowSelected}
        />
      )}
      {!!requiredDeposit && (
        <RequiredDepositInfo
          requiredDeposit={requiredDeposit}
          selectedToken={selectedToken}
          isOutgoingFlow={outgoingFlowSelected}
        />
      )}
    </>
  );
};

const UpdateFlow = React.memo(({ ...props }) => {
  const { panelState } = props;
  const { presetSuperTokenAddress, presetRecipient } = panelState.presetParams || {};
  const isFlowUpdateOperation = Boolean(presetSuperTokenAddress && presetRecipient);

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
