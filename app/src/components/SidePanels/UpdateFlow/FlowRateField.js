import { DropDown, Field, GU, noop, textStyle } from '@aragon/ui';
import React, { useCallback, useState } from 'react';
import { DAY, HOUR, MONTH, WEEK, YEAR } from '../../../helpers/time';
import AmountInput from '../AmountInput';

const RATE_ITEMS = ['/hour', '/day', '/week', '/month', '/year'];
const DEFAULT_RATE_ITEM = 3;
const RATE_IN_SECONDS = [HOUR, DAY, WEEK, MONTH, YEAR];
const ROUNDING = 8;

const computeFlowRate = (value, seconds) => (value / seconds).toFixed(ROUNDING);

const FlowRateField = React.forwardRef(({ onChange = noop }, ref) => {
  const [selectedRate, setSelectedRate] = useState(DEFAULT_RATE_ITEM);
  const [rateValue, setRateValue] = useState('');
  const valueInSeconds = computeFlowRate(rateValue, RATE_IN_SECONDS[selectedRate]);

  const handleInputChange = useCallback(
    value => {
      setRateValue(value);
      onChange((value / RATE_IN_SECONDS[selectedRate]).toString());
    },
    [selectedRate, onChange]
  );

  const handleDropdownChange = useCallback(
    index => {
      setSelectedRate(index);
      onChange((rateValue / RATE_IN_SECONDS[index]).toString());
    },
    [rateValue, onChange]
  );

  return (
    <Field label="Flow Rate" required>
      <div
        css={`
          display: flex;
          gap: ${1.5 * GU}px;
        `}
      >
        <div
          css={`
            width: 100%;
          `}
        >
          <AmountInput ref={ref} value={rateValue} onChange={handleInputChange} wide />
        </div>
        <div>
          <DropDown
            header="Rate"
            items={RATE_ITEMS}
            selected={selectedRate}
            onChange={handleDropdownChange}
          />
        </div>
      </div>
      {!!Number(valueInSeconds) && (
        <div
          css={`
            margin-top: ${2 * GU}px;
          `}
        >
          <span
            css={`
              ${textStyle('body1')};
              font-weight: bold;
            `}
          >
            {valueInSeconds}
          </span>
          <span
            css={`
              margin-left: ${1 * GU}px;
              ${textStyle('body3')};
            `}
          >
            tokens per second.
          </span>
        </div>
      )}
    </Field>
  );
});

export default FlowRateField;
