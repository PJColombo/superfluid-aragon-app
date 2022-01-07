import { useMemo } from 'react';
import { getConvertedAmount, isTestNetwork, USD } from '../helpers';
import useConvertRates from '../hooks/useConvertRates';

const getConvertRateToken = (superToken, isTestNetwork) =>
  isTestNetwork ? superToken.mainnetTokenEquivalentAddress : superToken.address;

const useBalanceItems = (superTokens, network) => {
  const isTestNet = network && isTestNetwork(network);
  const underlyingTokenAddresses = superTokens.map(superToken =>
    getConvertRateToken(superToken, isTestNet)
  );

  const convertRates = useConvertRates(underlyingTokenAddresses, [USD], 'ethereum');

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
      const conversionRate = convertRates[getConvertRateToken(superToken, isTestNet)]?.[USD];
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
