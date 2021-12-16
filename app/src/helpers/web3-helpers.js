import { toChecksumAddress } from 'web3-utils';

export const addressPattern = '(0x)?[0-9a-fA-F]{40}';

// Check address equality with checksums
export const addressesEqual = (first, second) => {
  first = first && toChecksumAddress(first);
  second = second && toChecksumAddress(second);
  return first === second;
};
