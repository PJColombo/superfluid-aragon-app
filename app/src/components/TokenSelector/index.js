import { useAragonApi } from '@aragon/api-react';
import {
  DropDown,
  Field,
  formatTokenAmount,
  GU,
  TextInput,
  textStyle,
  TokenBadge,
  useTheme,
} from '@aragon/ui';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { isAddress } from 'web3-utils';
import { isSuperToken, loadTokenData, loadTokenHolderBalance } from '../../helpers';
import TokenSelectorInstance from './TokenSelectorInstance';

const CUSTOM_TOKEN_INDEX = -1;

export const INITIAL_SELECTED_TOKEN = {
  index: -2,
  address: '',
  data: {},
  loadingData: false,
};

export const INVALID_TOKEN_ERROR = Symbol('INVALID_TOKEN_ERROR');
export const NO_TOKEN_BALANCE_ERROR = Symbol('NO_TOKEN_BALANCE_ERROR');
export const FETCH_TOKEN_ERROR = Symbol('FETCH_TOKEN_ERROR');

const toTokenItemsIndex = (index, allowCustomToken) => (allowCustomToken ? index + 1 : index);
const fromTokenItemsIndex = (index, allowCustomToken) => (allowCustomToken ? index - 1 : index);

const TokenSelector = ({
  tokens,
  disabled = false,
  label = 'Super Token',
  customTokenLabel = 'Super Token address',
  selectedToken,
  allowCustomToken = false,
  loadUserBalance = false,
  onChange,
  processCustomToken = address => address,
  validateToken = isSuperToken,
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
      onChange({ index: CUSTOM_TOKEN_INDEX, address: value, data: {}, loadingData: true });
    },
    [onChange]
  );

  useEffect(() => {
    const fetchTokenData = async (address, selectedToken, holder, isCustomToken) => {
      if (isCustomToken && !(await validateToken(address, api))) {
        onChange({ ...selectedToken, loadingData: false, error: INVALID_TOKEN_ERROR });
        return;
      }

      const processedAddress = isCustomToken ? await processCustomToken(address, api) : address;
      let updatedToken = { ...selectedToken, address: processedAddress, loadingData: false };
      try {
        if (isCustomToken) {
          const [decimals, name, symbol] = await loadTokenData(processedAddress, api);

          updatedToken.data = { decimals, name, symbol };
        } else {
          updatedToken.data = { ...selectedToken.data };
        }

        if (loadUserBalance) {
          const userBalance = await loadTokenHolderBalance(processedAddress, holder, api);
          updatedToken.data.userBalance = userBalance;
        }

        if (!updatedToken.data.userBalance || updatedToken.data.userBalance === '0') {
          updatedToken.error = NO_TOKEN_BALANCE_ERROR;
        }
        onChange(updatedToken);
      } catch (err) {
        updatedToken.error = FETCH_TOKEN_ERROR;
        onChange({
          ...selectedToken,
          address: processedAddress,
          loadingData: false,
          error: FETCH_TOKEN_ERROR,
        });
        console.error(err);
      }
    };

    const isCustomToken =
      !!customTokenAddress &&
      customTokenAddress.length &&
      selectedToken.index === CUSTOM_TOKEN_INDEX;
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
    processCustomToken,
    validateToken,
    onChange,
  ]);

  return (
    <React.Fragment>
      <Field label={label}>
        <DropDown
          header={label}
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
