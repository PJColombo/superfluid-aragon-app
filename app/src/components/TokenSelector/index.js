import { useAragonApi } from '@aragon/api-react';
import {
  DropDown,
  Field,
  formatTokenAmount,
  GU,
  isAddress,
  noop,
  TextInput,
  textStyle,
  TokenBadge,
  useTheme,
} from '@aragon/ui';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { isSuperToken, loadTokenData, loadTokenHolderBalance } from '../../helpers';
import TokenSelectorInstance from './TokenSelectorInstance';

export const INITIAL_TOKEN = {
  index: 0,
  address: '',
  data: {},
};

const getTokenIndex = (index, allowCustomToken) => (allowCustomToken ? index - 1 : index);

const TokenSelector = ({
  tokens,
  disabled = false,
  label = 'Token',
  selectedIndex,
  allowCustomToken = false,
  onChange,
  onError = noop,
}) => {
  const { api, connectedAccount, network } = useAragonApi();
  const [customToken, setCustomToken] = useState(INITIAL_TOKEN);
  const [userBalance, setUserBalance] = useState();
  const tokenItems = useMemo(() => {
    const items = [
      tokens.map(({ address, name, symbol }) => (
        <TokenSelectorInstance key={address} address={address} name={name} symbol={symbol} />
      )),
    ];

    return allowCustomToken ? ['Other…', ...items] : items;
  }, [allowCustomToken, tokens]);
  const token = tokens[getTokenIndex(selectedIndex, allowCustomToken)];
  const selectedToken =
    selectedIndex === 0
      ? customToken
      : selectedIndex > 0
      ? {
          index: selectedIndex,
          address: token.address,
          data: { decimals: token.decimals, symbol: token.symbol },
        }
      : null;
  const customTokenEnabled = allowCustomToken && selectedIndex === 0;

  const handleDropDownChange = useCallback(
    index => {
      setCustomToken(INITIAL_TOKEN);
      setUserBalance();

      onChange({
        index,
        address: customTokenEnabled ? '' : tokens[getTokenIndex(index, allowCustomToken)]?.address,
      });
    },
    [allowCustomToken, customToken.address, tokens, onChange]
  );

  const handleCustomTokenAddressChange = useCallback(({ target: { value } }) => {
    setCustomToken({ ...INITIAL_TOKEN, address: value });
    setUserBalance();

    onChange({ ...INITIAL_TOKEN, address: value, index: 0 });
  });

  useEffect(() => {
    const fetchTokenData = async (address, index, holder) => {
      if (!(await isSuperToken(address, api))) {
        onError('Token is not a valid Super Token.');
        return;
      }

      const accountBalance = await loadTokenHolderBalance(address, holder, api);
      if (index === 0) {
        const [decimals, , symbol] = await loadTokenData(address, api);

        setCustomToken(prevCustomToken => ({ ...prevCustomToken, data: { decimals, symbol } }));
      }

      setUserBalance(accountBalance);

      if (accountBalance === '0') {
        onError(`You don't have enough tokens to deposit.`);
      }
    };

    const { address, index } = selectedToken || {};

    if (!address || !isAddress(address) || !connectedAccount) {
      return;
    }

    fetchTokenData(address, index, connectedAccount);
  }, [connectedAccount, selectedToken?.index, selectedToken?.address]);

  return (
    <React.Fragment>
      <Field label={label}>
        <DropDown
          header="Token"
          placeholder="Select a token"
          items={tokenItems}
          selected={selectedIndex}
          onChange={handleDropDownChange}
          required
          wide
          disabled={disabled}
        />
      </Field>

      {customTokenEnabled && (
        <>
          <Field label="Token address">
            <TextInput
              value={customToken.address}
              onChange={handleCustomTokenAddressChange}
              required
              wide
            />
          </Field>
        </>
      )}
      {!!userBalance && (
        <SelectedTokenBalance
          token={selectedIndex === 0 ? customToken : selectedToken}
          userBalance={userBalance}
          networkType={network.type}
        />
      )}
    </React.Fragment>
  );
};

const SelectedTokenBalance = React.memo(({ token, userBalance, networkType }) => {
  const theme = useTheme();
  const { address, data: { decimals, symbol } = {} } = token;

  return (
    <div
      css={`
        ${textStyle('body3')}
        color: ${theme.surfaceContentSecondary};
        /* Adjust for Field's bottom margin */
        margin: -${2 * GU}px 0 ${3 * GU}px;
      `}
    >
      {!isAddress(address) || !userBalance ? null : (
        <div
          css={`
            display: flex;
            align-items: center;
          `}
        >
          You have {!userBalance ? 'no' : formatTokenAmount(userBalance, decimals)}{' '}
          <span
            css={`
              margin: 0 ${0.5 * GU}px;
            `}
          >
            <TokenBadge address={address} symbol={symbol} networkType={networkType} />
          </span>
          available.
        </div>
      )}
    </div>
  );
});

export default TokenSelector;
