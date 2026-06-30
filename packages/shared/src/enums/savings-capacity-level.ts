export const SAVINGS_CAPACITY_LEVELS = {
  DEFICIT: 'DEFICIT',
  LOW: 'LOW',
  MID: 'MID',
  HIGH: 'HIGH',
} as const;

export type SavingsCapacityLevel =
  (typeof SAVINGS_CAPACITY_LEVELS)[keyof typeof SAVINGS_CAPACITY_LEVELS];
