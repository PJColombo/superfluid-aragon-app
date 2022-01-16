import { Link } from '@aragon/ui';
import React from 'react';

const SUPER_TOKEN_URL = 'https://docs.superfluid.finance/superfluid/docs/super-tokens';

const SuperTokensLink = () => (
  <Link href={SUPER_TOKEN_URL} external>
    Super Tokens
  </Link>
);

export default SuperTokensLink;
