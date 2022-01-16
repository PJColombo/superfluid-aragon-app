import { GU } from '@aragon/ui';
import React from 'react';

const DEFAULT_SIZE = '15';

const UnknownTokenLogo = ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE }) => (
  <div
    css={`
      width: ${width}px;
      height: ${height}px;
      border-radius: 50%;
      background-color: #dcdcdc;
    `}
  />
);

export default UnknownTokenLogo;
