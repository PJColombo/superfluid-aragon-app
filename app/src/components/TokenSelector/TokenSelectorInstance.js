import { useNetwork } from '@aragon/api-react';
import { GU } from '@aragon/ui';
import IdentityBadge from '@aragon/ui/dist/IdentityBadge';
import React from 'react';
import styled from 'styled-components';
import { tokenIconUrl } from '../../helpers/icon-helpers';

const TokenSelectorInstance = React.memo(({ address, name, symbol, showIcon = true }) => {
  const network = useNetwork();

  return (
    <div
      css={`
        display: flex;
        align-items: center;
      `}
    >
      {showIcon ? (
        <Icon src={tokenIconUrl(address, symbol, network && network.type)} />
      ) : (
        <div
          css={`
            width: ${3 * GU}px;
          `}
        />
      )}
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

const Icon = styled.img.attrs({ alt: '', width: '16', height: '16' })`
  margin-right: ${1 * GU}px;
`;

export default TokenSelectorInstance;