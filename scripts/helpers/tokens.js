const { BigNumber } = require('ethers');

module.exports.NATIVE_TOKEN = 'ETH';
module.exports.ONE_TOKEN = BigNumber.from((1e18).toString());

const getSuperTokenName = (underlyingTokenName) => `${underlyingTokenName}x`;

module.exports.getSuperTokenName = getSuperTokenName;

module.exports.mintTestTokens = async (
  sf,
  recipients,
  tokens,
  amount,
  artifacts,
  log = console.log
) => {
  const FakeToken = artifacts.require('FakeToken');
  for (tokenName of tokens) {
    if (tokenName === this.NATIVE_TOKEN) {
      continue;
    }
    /**
     * Need to instantiate contract using FakeToken interface as the one provided by Superfluid
     * doesn't have the mint() function
     */
    const fakeToken = await FakeToken.at(sf.tokens[tokenName].address);

    for (recipient of recipients) {
      await fakeToken.methods['mint(address,uint256)'](recipient, amount);

      log(`${amount} ${tokenName} tokens minted for test account: ${recipient}`);
    }
  }
};

module.exports.upgradeTokens = async (sf, tokens, accounts, amount, log = console.log) => {
  for (let i = 0; i < tokens.length; i++) {
    const testToken = sf.tokens[tokens[i]];
    const superToken = sf.superTokens[getSuperTokenName(tokens[i])];

    for (account of accounts) {
      if (tokens[i] === this.NATIVE_TOKEN) {
        continue;
      }

      await testToken.approve(superToken.address, amount, { from: account });
      await superToken.upgrade(amount, { from: account });
      log(`${amount} tokens ${superToken.address} upgraded for ${account}`);
    }
  }
};
