import superTokenABI from '../abi/SuperToken.js';

export const isSuperToken = async (tokenAddress, app) => {
  try {
    const superToken = app.external(tokenAddress, superTokenABI);

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
