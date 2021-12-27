import { Field, GU, Info, TextInput } from '@aragon/ui';
import React, { useCallback, useEffect, useState } from 'react';
import { isAddress } from 'web3-utils';
import { toDecimals } from '../../../helpers';
import { DOWNGRADE } from '../../../super-token-operations';
import SuperTokensLink from '../../SuperTokensLink';
import TokenSelector, {
  INITIAL_SELECTED_TOKEN,
  INVALID_TOKEN_ERROR,
  NO_TOKEN_BALANCE_ERROR,
} from '../../TokenSelector';
import SubmitButton from '../SubmitButton';

const getTokenSelectorErrorMsg = type => {
  if (type === INVALID_TOKEN_ERROR) {
    return 'Token provided must be a valid Super Token.';
  } else if (type === NO_TOKEN_BALANCE_ERROR) {
    return "You don't have enough tokens to upgrade.";
  } else {
    return '';
  }
};

const Downgrade = ({ panelState, superTokens, onConvert }) => {
  const [selectedToken, setSelectedToken] = useState(INITIAL_SELECTED_TOKEN);
  const [amount, setAmount] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const disableSubmit = Boolean(
    errorMessage ||
      !selectedToken.address ||
      !isAddress(selectedToken.address) ||
      !amount ||
      Number(amount) <= 0
  );
  const displayError = errorMessage && errorMessage.length;

  const clear = () => {
    setSelectedToken(INITIAL_SELECTED_TOKEN);
    setAmount(0);
    setErrorMessage('');
  };

  const handleTokenChange = useCallback(token => {
    setSelectedToken(token);
    setErrorMessage(getTokenSelectorErrorMsg(token.error));
  }, []);

  const handleAmountChange = useCallback(({ target: { value } }) => {
    setAmount(value);
  }, []);

  const handleSubmit = async event => {
    event.preventDefault();

    const adjustedAmount = toDecimals(amount, selectedToken.decimals);
    panelState.requestTransaction(onConvert, [DOWNGRADE, selectedToken.address, adjustedAmount]);
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
          <TextInput
            type="number"
            value={amount}
            min={0}
            step="any"
            wide
            onChange={handleAmountChange}
          />
        </Field>
        <SubmitButton label="Downgrade" panelState={panelState} disabled={disableSubmit} />
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
        Downgrade your {<SuperTokensLink />} to their ERC20 version.
      </Info>
    </div>
  );
};

export default Downgrade;
