import { GU, IdentityBadge } from '@aragon/ui';
import React from 'react';
import styled from 'styled-components';

const TokenSelectorInstance = React.memo(({ address, logoURI, name, symbol, showIcon = true }) => {
  const displayLogo = showIcon && logoURI && logoURI.length;

  return (
    <div
      css={`
        display: flex;
        align-items: center;
      `}
    >
      {displayLogo ? (
        <div
          css={`
            position: relative;
            top: 2px;
          `}
        >
          <Icon src={logoURI} />
        </div>
      ) : null}
      {symbol && (
        <span
          css={`
            margin-right: ${1 * GU}px;
          `}
        >
          {symbol}
        </span>
      )}
      {name && (
        <span
          css={`
            max-width: 110px;
            margin-right: ${1 * GU}px;
            overflow: hidden;
            text-overflow: ellipsis;
          `}
        >
          ({name})
        </span>
      )}
      <IdentityBadge badgeOnly compact entity={address} />
    </div>
  );
});

const Icon = styled.img.attrs({ alt: '', width: '18', height: '18' })`
  margin-right: ${1 * GU}px;
`;

export default TokenSelectorInstance;
