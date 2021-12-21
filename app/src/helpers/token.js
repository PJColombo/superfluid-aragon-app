import superTokenABI from '../abi/SuperToken.json';

export const isSuperToken = async (tokenAddress, app) => {
  const superToken = app.external(tokenAddress, superTokenABI);

  try {
    await superToken.getHost().toPromise();
    return true;
  } catch (err) {
    return false;
  }
};

export const loadTokenData = (tokenAddress, app) => {
  const token = app.external(tokenAddress, superTokenABI);

  return Promise.all([
    token.decimals().toPromise(),
    token.name().toPromise(),
    token.symbol().toPromise(),
  ]);
};

export const loadTokenHolderBalance = (tokenAddress, holder, app) => {
  const token = app.external(tokenAddress, superTokenABI);

  return token.balanceOf(holder).toPromise();
};
