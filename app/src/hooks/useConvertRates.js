import { useEffect, useState, useRef } from 'react';
import { DEFAULT_CURRENCY } from '../helpers';

const CONVERT_API_RETRY_DELAY = 2 * 1000;
const CONVERT_API_RETRY_DELAY_MAX = 60 * 1000;

const BASE_URL = 'https://api.coingecko.com/api/v3/simple/token_price';

function convertRatesUrl(tokenAddresses, currencies, networkName) {
  return `${BASE_URL}/${networkName}?vs_currencies=${currencies}&contract_addresses=${tokenAddresses}`;
}

const useConvertRates = (
  tokenAddresses,
  currencies = [DEFAULT_CURRENCY],
  networkName = 'ethereum'
) => {
  const [rates, setRates] = useState({});
  const retryDelay = useRef(CONVERT_API_RETRY_DELAY);

  const tokenAddressesQueryValues = tokenAddresses?.join(',');
  const currenciesQueryValues = currencies.join(',');

  useEffect(() => {
    let cancelled = false;
    let retryTimer = null;

    const update = async () => {
      if (
        !tokenAddressesQueryValues ||
        !currenciesQueryValues ||
        !networkName ||
        !networkName.length
      ) {
        setRates({});
        return;
      }

      try {
        const response = await fetch(
          convertRatesUrl(tokenAddressesQueryValues, currenciesQueryValues, networkName)
        );
        const rates = await response.json();

        if (!cancelled) {
          setRates(rates);
          retryDelay.current = CONVERT_API_RETRY_DELAY;
        }
      } catch (err) {
        console.error(err);
        // The !cancelled check is needed in case:
        //  1. The fetch() request is ongoing.
        //  2. The component gets unmounted.
        //  3. An error gets thrown.
        //
        //  Assuming the fetch() request keeps throwing, it would create new
        //  requests even though the useEffect() got cancelled.
        if (!cancelled) {
          // Add more delay after every failed attempt
          retryDelay.current = Math.min(CONVERT_API_RETRY_DELAY_MAX, retryDelay.current * 1.2);
          retryTimer = setTimeout(update, retryDelay.current);
        }
      }
    };

    update();

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      retryDelay.current = CONVERT_API_RETRY_DELAY;
    };
  }, [tokenAddressesQueryValues, currenciesQueryValues, networkName]);

  return rates;
};

export default useConvertRates;
