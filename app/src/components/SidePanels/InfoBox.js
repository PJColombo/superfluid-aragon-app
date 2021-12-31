import { GU, Info } from '@aragon/ui';
import React from 'react';

const InfoBox = ({ children, mode }) => (
  <Info
    css={`
      margin-top: ${2 * GU}px;
    `}
    mode={mode}
  >
    {children}
  </Info>
);

export default InfoBox;
