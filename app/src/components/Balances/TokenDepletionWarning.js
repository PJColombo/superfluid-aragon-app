import React, { useRef, useState } from 'react';
import { Button, GU, IconWarning, noop, Popover, useLayout } from '@aragon/ui';
import Lottie from 'react-lottie-player';
import warningAnimatiom from '../../assets/warning-animation.json';
import { format, formatDistance } from 'date-fns';

const DepletionWarningPopover = ({ compact, depletionDate, onDeposit, ...props }) => {
  const formattedDepletionDate = depletionDate ? format(depletionDate, 'PPPPpp') : 'soon';
  const formattedDistanceDepletionDate = depletionDate
    ? `(${formatDistance(depletionDate, new Date(), { addSuffix: true })})`
    : '';

  return (
    <Popover placement={compact ? 'bottom' : 'right'} {...props}>
      <div
        css={`
          padding: ${2 * GU}px ${3 * GU}px;
          width: 100%;
          max-width: ${(compact ? 30 : 50) * GU}px;
          height: auto;
        `}
      >
        <div
          css={`
            margin-bottom: ${2 * GU}px;
          `}
        >
          <span
            css={`
              display: inline;
              position: relative;
              top: 6px;
            `}
          >
            <IconWarning color="#FF6B00" />
          </span>
          The balance is going to run out on{' '}
          <strong>
            {formattedDepletionDate} {formattedDistanceDepletionDate}
          </strong>
          . All flows will stop, make a deposit to keep them open.
        </div>
        <Button mode="strong" label="Make a deposit" onClick={onDeposit} wide />
      </div>
    </Popover>
  );
};

const TokenDepletionWarning = ({ depletionDate, size = 40, onDeposit }) => {
  const openerRef = useRef();
  const [visible, setVisible] = useState(false);
  const { layoutName } = useLayout();
  const compactMode = layoutName === 'small';

  const open = () => {
    setVisible(true);
  };
  const close = () => setVisible(false);

  const handleDepositClick = () => {
    setVisible(false);
    onDeposit();
  };

  return (
    <div onMouseLeave={close} onMouseEnter={open}>
      <div
        css={`
          cursor: pointer;
        `}
        ref={openerRef}
        onClick={compactMode ? open : noop}
      >
        <Lottie animationData={warningAnimatiom} play loop style={{ height: size, width: size }} />
      </div>
      <DepletionWarningPopover
        depletionDate={depletionDate}
        visible={visible}
        opener={openerRef.current}
        compact={compactMode}
        onClose={close}
        onDeposit={handleDepositClick}
      />
    </div>
  );
};

export default TokenDepletionWarning;
