import { Distribution, GU, textStyle, useTheme } from '@aragon/ui';
import React from 'react';
import { fromDecimals, toMonthlyRate } from '../../../helpers';

const FlowsDistribution = ({ inflowRate, outflowRate, tokenDecimals }) => {
  const theme = useTheme();
  const totalFlowRate = Number(fromDecimals(inflowRate.add(outflowRate)));
  const formattedInflowRate = fromDecimals(inflowRate, tokenDecimals);
  const formattedOutflowRate = fromDecimals(outflowRate, tokenDecimals);
  const inflowPct = (totalFlowRate === 0 ? 0 : (formattedInflowRate / totalFlowRate) * 100).toFixed(
    2
  );
  const outflowPct = (totalFlowRate === 0
    ? 0
    : (formattedOutflowRate / totalFlowRate) * 100
  ).toFixed(2);
  const monthlyInflowRate = toMonthlyRate(formattedInflowRate).toFixed(2);
  const monthlyOutflowRate = toMonthlyRate(formattedOutflowRate).toFixed(2);
  const distributionColors = [theme.negative, theme.positive];

  return (
    <Distribution
      colors={inflowPct < outflowPct ? distributionColors : distributionColors.reverse()}
      items={[
        { item: 'IN', percentage: Number(inflowPct) },
        { item: 'OUT', percentage: Number(outflowPct) },
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
                {isInflow ? monthlyInflowRate : monthlyOutflowRate}
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
