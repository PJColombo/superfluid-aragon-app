import { useAragonApi } from '@aragon/api-react';
import {
  DropDown,
  Field,
  formatTokenAmount,
  GU,
  noop,
  TextInput,
  textStyle,
  TokenBadge,
  useTheme,
} from '@aragon/ui';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { isAddress } from 'web3-utils';
import { isSuperToken, loadTokenData, loadTokenHolderBalance } from '../../helpers';
import TokenSelectorInstance from './TokenSelectorInstance';

export const INITIAL_SELECTED_TOKEN = {
  index: -2,
  address: '',
  data: {},
  loadingData: false,
};

const toTokenItemsIndex = (index, allowCustomToken) => (allowCustomToken ? index + 1 : index);
const fromTokenItemsIndex = (index, allowCustomToken) => (allowCustomToken ? index - 1 : index);

const TokenSelector = ({
  tokens,
  disabled = false,
  label = 'Token',
  customTokenLabel = 'Token address',
  selectedToken,
  allowCustomToken = false,
  loadUserBalance = false,
  onChange,
  validateToken = isSuperToken,
  onError = noop,
}) => {
  const { api, connectedAccount, network } = useAragonApi();
  const [customTokenAddress, setCustomTokenAddress] = useState('');
  const tokenItems = useMemo(() => {
    const items = tokens.map(({ address, name, symbol }) => (
      <TokenSelectorInstance key={address} address={address} name={name} symbol={symbol} />
    ));

    return allowCustomToken ? ['Other…', ...items] : items;
  }, [allowCustomToken, tokens]);
  const adjustedTokenIndex = toTokenItemsIndex(selectedToken.index, allowCustomToken);
  const customTokenEnabled = allowCustomToken && adjustedTokenIndex === 0;

  const handleDropDownChange = useCallback(
    index => {
      setCustomTokenAddress('');

      const tokenIndex = fromTokenItemsIndex(index, allowCustomToken);
      const token = tokens[tokenIndex];

      onChange({
        index: tokenIndex,
        address: token ? token.address : '',
        data: token ? { decimals: token.decimals, name: token.name, symbol: token.symbol } : {},
        loadingData: loadUserBalance,
      });
    },
    [allowCustomToken, loadUserBalance, tokens, onChange]
  );

  const handleCustomTokenAddressChange = useCallback(
    ({ target: { value } }) => {
      setCustomTokenAddress(value);
      onChange({ index: -1, address: value, data: {}, loadingData: true });
    },
    [onChange]
  );

  useEffect(() => {
    const fetchTokenData = async (address, selectedToken, holder, isCustomToken) => {
      if (!(await validateToken(address, api))) {
        onError(undefined, address);
        return;
      }

      let tokenData = {};
      let userBalance;
      try {
        if (isCustomToken) {
          const [decimals, name, symbol] = await loadTokenData(address, api);

          tokenData = { decimals, name, symbol };
        } else {
          tokenData = { ...selectedToken.data };
        }

        if (loadUserBalance) {
          const userBalance = await loadTokenHolderBalance(address, holder, api);
          tokenData.userBalance = userBalance;
        }

        onChange({
          ...selectedToken,
          address,
          data: tokenData,
          loadingData: false,
        });

        if (userBalance === '0') {
          onError(`You don't have enough tokens to deposit.`);
        }
      } catch (err) {
        onChange({ ...selectedToken, address, data: tokenData, loadingData: false });
        console.error(err);
      }
    };
    const isCustomToken =
      !!customTokenAddress && customTokenAddress.length && selectedToken.index < 0;
    const tokenAddress = isCustomToken ? customTokenAddress : selectedToken.address;

    if (
      !selectedToken.loadingData ||
      !tokenAddress ||
      !isAddress(tokenAddress) ||
      !connectedAccount
    ) {
      return;
    }

    fetchTokenData(tokenAddress, selectedToken, connectedAccount, isCustomToken);
  }, [
    api,
    connectedAccount,
    customTokenAddress,
    loadUserBalance,
    selectedToken,
    validateToken,
    onChange,
    onError,
  ]);

  return (
    <React.Fragment>
      <Field label={label}>
        <DropDown
          header="Token"
          placeholder="Select a token"
          items={tokenItems}
          selected={adjustedTokenIndex}
          onChange={handleDropDownChange}
          required
          wide
          disabled={disabled}
        />
      </Field>

      {customTokenEnabled && (
        <>
          <Field label={customTokenLabel}>
            <TextInput
              value={customTokenAddress}
              onChange={handleCustomTokenAddressChange}
              required
              wide
            />
          </Field>
        </>
      )}
      {loadUserBalance && <SelectedTokenBalance token={selectedToken} networkType={network.type} />}
    </React.Fragment>
  );
};

const SelectedTokenBalance = ({ token, networkType }) => {
  const theme = useTheme();
  const { address, data: { decimals, symbol, userBalance } = {} } = token;

  if (!isAddress(address) || !userBalance) {
    return null;
  }

  return (
    <div
      css={`
        ${textStyle('body3')};
        color: ${theme.surfaceContentSecondary};
        /* Adjust for Field's bottom margin */
        margin: -${2 * GU}px 0 ${3 * GU}px;
      `}
    >
      <div
        css={`
          display: flex;
          align-items: center;
        `}
      >
        You have {userBalance === '0' ? 'no' : formatTokenAmount(userBalance, decimals)}{' '}
        <span
          css={`
            margin: 0 ${0.5 * GU}px;
          `}
        >
          <TokenBadge address={address} symbol={symbol} networkType={networkType} />
        </span>
        available.
      </div>
    </div>
  );
};

export default TokenSelector;
