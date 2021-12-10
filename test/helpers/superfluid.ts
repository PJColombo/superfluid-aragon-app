import { MONTH, toDecimals } from '.';

export const computeFlowRate = (tokensPerMonth: number) => toDecimals(tokensPerMonth / MONTH);
