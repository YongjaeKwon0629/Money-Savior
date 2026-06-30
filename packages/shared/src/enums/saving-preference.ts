export const SAVING_PREFERENCES = {
  STABLE: 'STABLE',
  BALANCED: 'BALANCED',
  AGGRESSIVE: 'AGGRESSIVE',
} as const;

export type SavingPreference = (typeof SAVING_PREFERENCES)[keyof typeof SAVING_PREFERENCES];
