// Monetization is NOT active at launch.
// Tumby launches free to build users, reviews, and retention data.
// Activate PREMIUM_ENABLED = true when ready for RevenueCat integration.

export const PREMIUM_ENABLED = false;

export const PREMIUM_FEATURES = {
  advancedInsights: false,
  exportReports: false,
  aiCoach: false,
  customChallenges: false,
  customReminderSchedules: false,
  pediatricianSharing: false,
} as const;

export function isPremium(): boolean {
  return PREMIUM_ENABLED;
}

export function canAccess(_feature: keyof typeof PREMIUM_FEATURES): boolean {
  return true; // everything free at launch
}
