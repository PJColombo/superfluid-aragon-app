import { DropDown, Field, GU, noop, TextInput, textStyle } from '@aragon/ui';
import React, { useCallback, useState } from 'react';
import { DAY, HOUR, MONTH, WEEK, YEAR } from '../../../helpers/time';

const RATE_ITEMS = ['/hour', '/day', '/week', '/month', '/year'];
const DEFAULT_RATE_ITEM = 3;
const RATE_IN_SECONDS = [HOUR, DAY, WEEK, MONTH, YEAR];
const ROUNDING = 8;

const computeFlowRate = (value, seconds) => (value / seconds).toFixed(ROUNDING);

const FlowRateField = ({ onChange = noop }) => {
  const [selectedRate, setSelectedRate] = useState(DEFAULT_RATE_ITEM);
  const [rateValue, setRateValue] = useState('');
  const valueInSeconds = computeFlowRate(rateValue, RATE_IN_SECONDS[selectedRate]);

  const handleInputChange = useCallback(
    ({ target: { value } }) => {
      setRateValue(value);
      onChange((value / RATE_IN_SECONDS[selectedRate]).toString());
    },
    [selectedRate, setRateValue, onChange]
  );

  return (
    <Field label="Flow Rate" required>
      <div
        css={`
          display: flex;
          gap: ${1.5 * GU}px;
        `}
      >
        <TextInput type="number" value={rateValue} step="any" wide onChange={handleInputChange} />
        <div
          css={`
            width: 40%;
          `}
        >
          <DropDown
            header="Rate"
            items={RATE_ITEMS}
            selected={selectedRate}
            onChange={setSelectedRate}
            wide
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
};

export default FlowRateField;
