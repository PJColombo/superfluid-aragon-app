import { Distribution, GU, textStyle, useTheme } from '@aragon/ui';
import BN from 'bn.js';
import React from 'react';
import { fromDecimals, toMonthlyRate, ZERO_BN } from '../../../helpers';

const ONE_HUNDRED_BN = new BN(100);

const FlowsDistribution = ({ inflowRate, outflowRate, netFlow, tokenDecimals }) => {
  const theme = useTheme();
  const absNetFlow = netFlow.abs();
  const inflowPct = absNetFlow.eq(ZERO_BN)
    ? new BN(0)
    : inflowRate.div(absNetFlow).mul(ONE_HUNDRED_BN);
  const outflowPct = absNetFlow.eq(ZERO_BN)
    ? new BN(0)
    : outflowRate.div(absNetFlow).mul(ONE_HUNDRED_BN);
  const formattedInflowPct = Number(inflowPct.toNumber().toFixed(2));
  const formattedOutflowPct = Number(outflowPct.toNumber().toFixed(2));
  const formattedInflow = toMonthlyRate(fromDecimals(inflowRate, tokenDecimals)).toFixed(2);
  const formattedOutflow = toMonthlyRate(fromDecimals(outflowRate, tokenDecimals)).toFixed(2);

  return (
    <Distribution
      colors={[theme.negative, theme.positive]}
      items={[
        { item: 'IN', percentage: formattedInflowPct },
        { item: 'OUT', percentage: formattedOutflowPct },
      ]}
      renderFullLegendItem={({ index, item, percentage }) => {
        const isFirstItem = index === 0;
        const isInflow = item === 'IN';

        return (
          <div
            css={`
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-top: ${(isFirstItem ? -1.5 : -1) * GU}px;
              ${textStyle('body3')};
            `}
          >
            <span>
              <div
                css={`
                  display: inline-block;
                  width: 7px;
                  height: 7px;
                  border-radius: 50%;
                  background-color: ${isInflow ? theme.positive : theme.negative};
                  margin-right: ${1 * GU}px;
                `}
              />
              <strong>{item}</strong>
            </span>
            <span
              css={`
                display: flex;
                align-items: center;
                justify-content: flex-end;
                max-width: 75%;
              `}
            >
              <span
                css={`
                  display: inline-block;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  overflow: hidden;
                  width: 100%;
                `}
              >
                {isInflow ? formattedInflow : formattedOutflow}
              </span>
              <span
                css={`
                  margin-left: ${1 * GU}px;
                `}
              >
                ({percentage}%)
              </span>
            </span>
          </div>
        );
      }}
    />
  );
};

export default FlowsDistribution;
