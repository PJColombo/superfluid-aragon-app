import { Button, Field, GU, Info, TextInput, useSidePanelFocusOnReady } from '@aragon/ui';
import React, { useCallback, useEffect, useState } from 'react';
import { addressPattern } from '../../../helpers';
import LocalIdentitiesAutoComplete from '../../LocalIdentitiesAutoComplete';
import SuperTokensLink from '../../SuperTokensLink';
import TokenSelector, { INITIAL_TOKEN } from '../../TokenSelector';

const Withdrawal = ({ superTokens, onWithdrawal }) => {
  const [selectedToken, setSelectedToken] = useState(INITIAL_TOKEN);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const recipientInputRef = useSidePanelFocusOnReady();

  const disableSubmit = Boolean(errorMessage || !recipient || !amount);

  const clear = () => {
    setSelectedToken(INITIAL_TOKEN);
    setRecipient('');
    setAmount(0);
    setErrorMessage('');
  };

  const handleTokenChange = useCallback(value => {
    setSelectedToken(value);
    setErrorMessage('');
  }, []);

  const handleRecipientChange = useCallback(value => {
    setRecipient(value);
    setErrorMessage('');
  }, []);

  const handleAmountChange = useCallback(value => {
    setAmount(value);
    setErrorMessage('');
  }, []);

  const handleSubmit = async event => {
    event.preventDefault();

    onWithdrawal();
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
          selectedIndex={selectedToken.index}
          onChange={handleTokenChange}
        />
        <Field label="Amount" required>
          <TextInput
            type="number"
            value={amount}
            min={0}
            step="any"
            wide
            onChange={handleAmountChange}
          />
        </Field>
        <Button mode="strong" type="submit" disabled={disableSubmit} wide>
          Withdraw
        </Button>
      </form>
      <div
        css={`
          margin-top: ${3 * GU}px;
        `}
      >
        <Info>
          You'll receive {<SuperTokensLink />} from the Flow Finance app. <br />
          You can convert them to their ERC20 counterpart by going to the &quot;Convert Tokens&quot;
          side panel.
        </Info>
      </div>
    </div>
  );
};

export default Withdrawal;
