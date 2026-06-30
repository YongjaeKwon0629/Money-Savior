export const EMERGENCY_FUND_STATUSES = {
  NONE: 'NONE',
  INSUFFICIENT: 'INSUFFICIENT',
  SUFFICIENT: 'SUFFICIENT',
} as const;

export type EmergencyFundStatus =
  (typeof EMERGENCY_FUND_STATUSES)[keyof typeof EMERGENCY_FUND_STATUSES];
