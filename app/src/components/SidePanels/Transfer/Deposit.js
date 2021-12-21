import { Button, Field, GU, Info, TextInput } from '@aragon/ui';
import React, { useCallback, useEffect, useState } from 'react';
import { toDecimals } from '../../../helpers';
import SuperTokensLink from '../../SuperTokensLink';
import TokenSelector, { INITIAL_TOKEN } from '../../TokenSelector';
import ValidationError from '../../ValidationError';

const Deposit = ({ superTokens, onDeposit }) => {
  const [selectedToken, setSelectedToken] = useState(INITIAL_TOKEN);
  const [amount, setAmount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const disableSubmit = Boolean(errorMessage || !selectedToken.address || !amount);

  const clear = () => {
    setSelectedToken(INITIAL_TOKEN);
    setAmount(0);
    setErrorMessage('');
  };

  const handleTokenChange = useCallback(value => {
    setSelectedToken(value);
    setErrorMessage('');
  }, []);

  const handleAmountChange = useCallback(({ target: { value } }) => {
    setAmount(value);
  }, []);

  const handleSubmit = async event => {
    event.preventDefault();

    const adjustedAmount = toDecimals(amount, superTokens[selectedToken.index].decimals);

    onDeposit(selectedToken.address, adjustedAmount, true);
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
          selectedIndex={selectedToken.index}
          onChange={handleTokenChange}
          onError={setErrorMessage}
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
        <Button mode="strong" type="submit" disabled={disableSubmit} wide>
          Deposit
        </Button>
      </form>
      {errorMessage && <ValidationError messages={[errorMessage]} />}
      <div
        css={`
          margin-top: ${3 * GU}px;
        `}
      >
        <Info>
          The Flow Finance app expects to receive {<SuperTokensLink />}. <br />
          If you don&apos;t have any, go to the &quot;Convert Token&quot; side panel to convert some
          of your ERC20 to their Super Token counterpart.
        </Info>
      </div>
    </div>
  );
};

export default Deposit;
