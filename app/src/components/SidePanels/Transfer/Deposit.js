import { Field, GU, Info } from '@aragon/ui';
import React, { useCallback, useEffect, useState } from 'react';
import { isAddress } from 'web3-utils';
import { fromDecimals, toDecimals } from '../../../helpers';
import SuperTokensLink from '../../SuperTokensLink';
import TokenSelector, {
  INITIAL_SELECTED_TOKEN,
  INVALID_TOKEN_ERROR,
  NO_TOKEN_BALANCE_ERROR,
} from '../../TokenSelector';
import AmountInput from '../AmountInput';
import SubmitButton from '../SubmitButton';

const validateFields = (token, amount) => {
  const tokenError = token.error;
  if (tokenError === INVALID_TOKEN_ERROR) {
    return 'Super Token address provided must be a valid Super Token contract.';
  } else if (tokenError === NO_TOKEN_BALANCE_ERROR) {
    return "You don't have super tokens to deposit.";
  } else if (!isAddress(token.address)) {
    return 'Super Token address must be a valid Ethereum address.';
  } else if (Number(amount) <= 0) {
    return "Amount provided can't be negative nor zero.";
  }
};

const Deposit = ({ panelState, superTokens, onDeposit }) => {
  const [selectedToken, setSelectedToken] = useState(INITIAL_SELECTED_TOKEN);
  const [amount, setAmount] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const disableSubmit = Boolean(errorMessage || !selectedToken.address || !amount);
  const displayError = errorMessage && errorMessage.length;

  const clear = () => {
    setSelectedToken(INITIAL_SELECTED_TOKEN);
    setAmount('');
    setErrorMessage('');
  };

  const handleTokenChange = useCallback(token => {
    setSelectedToken(token);
    setErrorMessage('');
  }, []);

  const handleAmountChange = useCallback(({ target: { value } }) => {
    setAmount(value);
    setErrorMessage('');
  }, []);

  const handleMaxAmount = useCallback(() => {
    const { data } = selectedToken;
    if (!data.decimals || !data.userBalance || data.userBalance === '0') {
      return;
    }

    setAmount(fromDecimals(data.userBalance, data.decimals));
  }, [selectedToken]);

  const handleSubmit = async event => {
    event.preventDefault();

    const error = validateFields(selectedToken, amount);

    if (error && error.length) {
      setErrorMessage(error);
      return;
    }

    const adjustedAmount = toDecimals(amount, selectedToken.decimals);

    panelState.requestTransaction(onDeposit, [selectedToken.address, adjustedAmount, true]);
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
        <TokenSelector
          tokens={superTokens}
          selectedToken={selectedToken}
          onChange={handleTokenChange}
          loadUserBalance
          allowCustomToken
        />
        <Field label="Amount" required>
          <AmountInput
            amount={amount}
            step="any"
            onChange={handleAmountChange}
            onMaxClick={handleMaxAmount}
            showMax
            wide
          />
        </Field>
        <SubmitButton panelState={panelState} label="Deposit" disabled={disableSubmit} />
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
      <Info
        css={`
          margin-top: ${3 * GU}px;
        `}
      >
        The Flow Finance app expects to receive {<SuperTokensLink />}. <br />
        If you don&apos;t have any, go to the &quot;Convert Token&quot; side panel to convert some
        of your ERC20 to their Super Token version.
      </Info>
    </div>
  );
};

export default Deposit;
