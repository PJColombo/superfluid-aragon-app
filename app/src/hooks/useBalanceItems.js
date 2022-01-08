import { useNetwork } from '@aragon/api-react';
import { useMemo } from 'react';
import { DEFAULT_CURRENCY, getConvertedAmount, isTestNetwork } from '../helpers';
import useConvertRates from '../hooks/useConvertRates';

const getConvertRateToken = (superToken, isTestNetwork) =>
  isTestNetwork ? superToken.mainnetTokenEquivalentAddress : superToken.address;

const useBalanceItems = superTokens => {
  const network = useNetwork();
  const isTestNet = network && isTestNetwork(network);
  const underlyingTokenAddresses = superTokens.map(superToken =>
    getConvertRateToken(superToken, isTestNet)
  );

  const convertRates = useConvertRates(underlyingTokenAddresses, [DEFAULT_CURRENCY], 'ethereum');

  const balanceItems = useMemo(() => {
    return superTokens.map(superToken => {
      const {
        address,
        balance: amount,
        decimals,
        lastUpdateDate,
        logoURI,
        netFlow,
        symbol,
      } = superToken;
      const conversionRate =
        convertRates[getConvertRateToken(superToken, isTestNet)]?.[DEFAULT_CURRENCY];
      let convertedAmount, convertedNetFlow;

      if (conversionRate) {
        convertedAmount = getConvertedAmount(amount, conversionRate);
        convertedNetFlow = getConvertedAmount(netFlow, conversionRate);
      }

      return {
        address,
        amount,
        convertedAmount,
        decimals,
        logoURI,
        symbol,
        lastUpdateDate,
        netFlow,
        convertedNetFlow,
      };
    });
  }, [convertRates, superTokens, isTestNet]);
  return balanceItems;
};

export default useBalanceItems;
