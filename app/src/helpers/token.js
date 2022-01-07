import { isAddress } from 'web3-utils';
import erc20ABI from '../abi/ERC20.json';

export const loadTokenData = (token, app) => {
  let tokenContract;

  if (isAddress(token)) {
    tokenContract = app.external(token, erc20ABI);
  } else {
    tokenContract = token;
  }

  return Promise.all([
    tokenContract.decimals().toPromise(),
    tokenContract.name().toPromise(),
    tokenContract.symbol().toPromise(),
  ]);
};

export const loadTokenHolderBalance = (tokenAddress, holder, app) => {
  const token = app.external(tokenAddress, erc20ABI);

  return token.balanceOf(holder).toPromise();
};

export const getFakeTokenSymbol = symbol =>
  symbol && symbol.charAt(0) === 'f' ? symbol.slice(1, symbol.length) : symbol;
