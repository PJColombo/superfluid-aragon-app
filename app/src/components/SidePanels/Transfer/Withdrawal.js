import { Field, GU, Info, useSidePanelFocusOnReady } from '@aragon/ui';
import React, { useCallback, useEffect, useState } from 'react';
import { isAddress } from 'web3-utils';
import { addressPattern } from '../../../helpers';
import LocalIdentitiesAutoComplete from '../../LocalIdentitiesAutoComplete';
import SuperTokensLink from '../../SuperTokensLink';
import TokenSelector, { INITIAL_SELECTED_TOKEN } from '../../TokenSelector';
import AmountInput from '../AmountInput';
import SubmitButton from '../SubmitButton';

const validateFields = (recipient, amount) => {
  if (!isAddress(recipient)) {
    return 'Recipient must be a valid Ethereum address.';
  } else if (Number(amount) <= 0) {
    return "Amount provided can't be negative nor zero.";
  }
};

const Withdrawal = ({ panelState, superTokens, onWithdrawal }) => {
  const [selectedToken, setSelectedToken] = useState(INITIAL_SELECTED_TOKEN);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const recipientInputRef = useSidePanelFocusOnReady();
  const disableSubmit = Boolean(errorMessage || !recipient || !selectedToken.address || !amount);
  const displayError = errorMessage && errorMessage.length;

  const clear = () => {
    setSelectedToken(INITIAL_SELECTED_TOKEN);
    setRecipient('');
    setAmount('');
    setErrorMessage('');
  };

  const handleTokenChange = useCallback(token => {
    setSelectedToken(token);
    setErrorMessage('');
  }, []);

  const handleRecipientChange = useCallback(recipient => {
    setRecipient(recipient);
    setErrorMessage('');
  }, []);

  const handleAmountChange = useCallback(({ target: { value } }) => {
    setAmount(value);
    setErrorMessage('');
  }, []);

  const handleSubmit = async event => {
    event.preventDefault();

    const error = validateFields(recipient, amount);

    if (error && error.length) {
      setErrorMessage(error);
      return;
    }

    panelState.requestTransaction(onWithdrawal, []);
  };

  // handle reset when opening
  useEffect(() => {
    return () => {
      clear();
    };
  }, []);

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <Field
          label="Recipient (must be a valid Ethereum address)"
          css={`
            height: 60px;
          `}
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
          onChange={handleTokenChange}
        />
        <Field label="Amount" required>
          <AmountInput amount={amount} onChange={handleAmountChange} wide />
        </Field>
        <SubmitButton panelState={panelState} label="Withdraw" disabled={disableSubmit} />
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
      <div
        css={`
          margin-top: ${3 * GU}px;
        `}
      >
        <Info>
          The receipient will receive {<SuperTokensLink />} from the Flow Finance app. <br />
          This tokens can be converted to their ERC20 version by going to the &quot;Convert
          Tokens&quot; side panel.
        </Info>
      </div>
    </div>
  );
};

export default Withdrawal;
