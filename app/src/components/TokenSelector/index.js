import { DropDown, Field, noop, TextInput } from '@aragon/ui';
import React, { useCallback, useMemo, useState } from 'react';
import TokenSelectorInstance from './TokenSelectorInstance';

const TokenSelector = ({
  tokens,
  label = 'Token',
  labelCustomToken = 'Token address or symbol',
  selectedIndex = -1,
  allowCustomToken = false,
  onChange = noop,
}) => {
  const [customToken, setCustomToken] = useState('');
  const tokenItems = useMemo(() => {
    const items = [
      tokens.map(({ address, name, symbol }) => (
        <TokenSelectorInstance key={address} address={address} name={name} symbol={symbol} />
      )),
    ];

    return allowCustomToken ? ['Other…', ...items] : items;
  }, [allowCustomToken, tokens]);
  const showCustomToken = allowCustomToken && selectedIndex === 0;

  const getAddressFromTokens = index => {
    if (allowCustomToken && index === 0) {
      return customToken.address;
    }

    // Adjust for custom address
    const token = tokens[allowCustomToken ? index - 1 : index];
    return token.address;
  };

  const handleChange = useCallback(
    index => {
      setCustomToken('');
      const address = getAddressFromTokens(index);

      onChange({ address, index });
    },
    [onChange]
  );

  const handleCustomTokenChange = useCallback(({ target: { value } }) => {
    setCustomToken(value);
    onChange({ address: value, index: 0 });
  });

  return (
    <React.Fragment>
      <Field label={label}>
        <DropDown
          header="Token"
          placeholder="Select a token"
          items={tokenItems}
          selected={selectedIndex}
          onChange={handleChange}
          required
          wide
        />
      </Field>

      {allowCustomToken && showCustomToken && (
        <Field label={labelCustomToken}>
          <TextInput value={customToken} onChange={handleCustomTokenChange} required wide />
        </Field>
      )}
    </React.Fragment>
  );
};

export default TokenSelector;
