// Super Tokens taken from https://docs.superfluid.finance/superfluid/protocol-developers/networks.
export const PRESET_SUPER_TOKENS = new Map([
  [
    1337, // Local
    [
      '0xE4460795D4d6549d99788F6e8d7df0AC56d21996', // fDAIx,
      '0xD88692862751b86145638a76e3C10306638BD95B', // fUSDCx
      '0xdc532eb7f633018A9E58Fa0Df8cb4DE9c53c0227', // fTUSDCx
      '0x3990b44d6233D8287c62635028FAc7b046c5607A', // ETHx
    ],
  ],
  [
    4, // Rinkeby
    [
      '0x745861AeD1EEe363b4AaA5F1994Be40b1e05Ff90', // fDAIx
      '0x0F1D7C55A2B133E000eA10EeC03c774e0d6796e8', // fUSDCx
      '0xdF7B8461a1d9f57f12F88d97FC6131E36d302d81', // fTUSDx
      '0xa623b2DD931C5162b7a0B25852f4024Db48bb1A0', // ETHx
    ],
  ],
  [
    100, // xDAI
    [
      '0x59988e47A3503AaFaA0368b9deF095c818Fdca01', // xDAIx
    ],
  ],
  [
    137, // Polygon
    [
      '0x3aD736904E9e65189c3000c7DD2c8AC8bB7cD4e3', // MATICx
      '0x27e1e4E6BC79D93032abef01025811B7E4727e85', // ETHx
      '0xCAa7349CEA390F89641fe306D93591f87595dc1F', // USDCx
      '0x1305F6B6Df9Dc47159D12Eb7aC2804d4A33173c2', // DAIx
      '0x4086eBf75233e8492F1BCDa41C7f2A8288c2fB92', // WBTCx
    ],
  ],
]);
