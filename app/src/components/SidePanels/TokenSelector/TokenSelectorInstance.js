import { GU, IdentityBadge } from '@aragon/ui';
import React from 'react';
import UnknownTokenLogo from '../../UnknownTokenLogo';

const TOKEN_ICON_SIZE = '18';

const TokenSelectorInstance = React.memo(({ address, logoURI, name, symbol, showIcon = true }) => {
  const logoExists = Boolean(logoURI && logoURI.length);

  return (
    <div
      css={`
        display: flex;
        align-items: center;
      `}
    >
      {showIcon ? (
        <div
          css={`
            position: relative;
            top: ${logoExists ? '2' : '-2'}px;
            margin-right: ${1 * GU}px;
          `}
        >
          {logoExists ? (
            <img alt="" width={TOKEN_ICON_SIZE} height={TOKEN_ICON_SIZE} src={logoURI} />
          ) : (
            <UnknownTokenLogo width={TOKEN_ICON_SIZE} height={TOKEN_ICON_SIZE} />
          )}
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

export default TokenSelectorInstance;
