import { ButtonBase, GU, RADIUS, TextInput, useTheme } from '@aragon/ui';
import React, { useState } from 'react';

const MAX_BUTTON_WIDTH = 6 * GU;

const AmountInput = React.forwardRef(({ amount, showMax, onChange, onMaxClick, ...props }, ref) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  return (
    <TextInput
      ref={ref}
      css={`
        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button {
          -webkit-appearance: none;
        }
      `}
      type="number"
      value={amount}
      step="any"
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onChange={onChange}
      adornment={
        showMax && (
          <ButtonBase
            focusRingRadius={RADIUS}
            onClick={onMaxClick}
            css={`
              ${isFocused ? `color: ${theme.info};` : null}
              width: ${MAX_BUTTON_WIDTH}px;
              height: calc(100% - 2px);
              text-transform: uppercase;
              &:active {
                transform: translate(0.5px, 0.5px);
              }
            `}
          >
            Max
          </ButtonBase>
        )
      }
      adornmentPosition="end"
      adornmentSettings={{ width: MAX_BUTTON_WIDTH, padding: 1 }}
      {...props}
    />
  );
});

export default AmountInput;
