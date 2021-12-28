import { Field, GU, Info, TextInput } from '@aragon/ui';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { isAddress } from 'web3-utils';
import { toDecimals } from '../../../helpers';
import { UPGRADE } from '../../../super-token-operations';
import TokenSelector, {
  INITIAL_SELECTED_TOKEN,
  INVALID_TOKEN_ERROR,
  NO_TOKEN_BALANCE_ERROR,
} from '../../TokenSelector';
import superTokenAbi from '../../../abi/RawSuperToken.json';
import SuperTokensLink from '../../SuperTokensLink';
import SubmitButton from '../SubmitButton';

const processCustomSuperToken = async (address, api) => {
  const customSuperToken = api.external(address, superTokenAbi);
  const underlyingTokenAddress = await customSuperToken.getUnderlyingToken().toPromise();

  return underlyingTokenAddress;
};

const validateFields = (token, amount) => {
  const tokenError = token.error;
  if (tokenError === INVALID_TOKEN_ERROR) {
    return 'Super Token address provided must be a valid Super Token contract.';
  } else if (tokenError === NO_TOKEN_BALANCE_ERROR) {
    return "You don't have tokens to upgrade.";
  } else if (!isAddress(token.address)) {
    return 'Token address must be a valid Ethereum address.';
  } else if (Number(amount) <= 0) {
    return "Amount provided can't be negative nor zero.";
  }
};

const Upgrade = ({ panelState, superTokens, onConvert }) => {
  const [selectedToken, setSelectedToken] = useState(INITIAL_SELECTED_TOKEN);
  const [amount, setAmount] = useState('');
  const [errorMessage, setErrorMessage] = useState();
  const underlyingTokens = useMemo(
    () => superTokens.map(superToken => ({ ...superToken.underlyingToken })),
    [superTokens]
  );
  const disableSubmit = Boolean(errorMessage || !selectedToken.address || !amount);
  const displayError = errorMessage && errorMessage.length;

  const clear = () => {
    setSelectedToken(INITIAL_SELECTED_TOKEN);
    setAmount('');
    setErrorMessage();
  };

  const handleTokenChange = useCallback(token => {
    setSelectedToken(token);
    setErrorMessage('');
  }, []);

  const handleAmountChange = useCallback(({ target: { value } }) => {
    setAmount(value);
    setErrorMessage('');
  }, []);

  const handleSubmit = async event => {
    event.preventDefault();

    const error = validateFields(selectedToken, amount);

    if (error && error.length) {
      setErrorMessage(error);
      return;
    }

    const adjustedAmount = toDecimals(amount, selectedToken.decimals);

    panelState.requestTransaction(onConvert, [
      UPGRADE,
      superTokens[selectedToken.index].address,
      adjustedAmount,
    ]);
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
          label="Token"
          tokens={underlyingTokens}
          selectedToken={selectedToken}
          onChange={handleTokenChange}
          processCustomToken={processCustomSuperToken}
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
        <SubmitButton label="Update" panelState={panelState} disabled={disableSubmit} />
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
        Upgrade your ERC20 tokens to their {<SuperTokensLink />} version.
      </Info>
    </div>
  );
};

export default Upgrade;
