// Blocked countries configuration for US-based business compliance
// Based on OFAC sanctions and regulatory requirements

export interface BlockedCountry {
  code: string;
  name: string;
  reason: 'ofac' | 'high_risk' | 'payment' | 'data_privacy';
}

// OFAC Sanctioned Countries - Legally required for US businesses
export const OFAC_SANCTIONED: BlockedCountry[] = [
  { code: 'CU', name: 'Cuba', reason: 'ofac' },
  { code: 'IR', name: 'Iran', reason: 'ofac' },
  { code: 'KP', name: 'North Korea', reason: 'ofac' },
  { code: 'SY', name: 'Syria', reason: 'ofac' },
  { code: 'RU', name: 'Russia', reason: 'ofac' },
  { code: 'BY', name: 'Belarus', reason: 'ofac' },
];

// High fraud risk regions (can be adjusted based on actual fraud patterns)
export const HIGH_RISK_COUNTRIES: BlockedCountry[] = [
  // Currently empty - add countries if fraud issues arise
  // { code: 'NG', name: 'Nigeria', reason: 'high_risk' },
  // { code: 'GH', name: 'Ghana', reason: 'high_risk' },
  // { code: 'CM', name: 'Cameroon', reason: 'high_risk' },
];

// Combined list of all blocked countries
export const BLOCKED_COUNTRIES: BlockedCountry[] = [
  ...OFAC_SANCTIONED,
  ...HIGH_RISK_COUNTRIES,
];

// Simple array of country codes for quick lookup
export const BLOCKED_COUNTRY_CODES = BLOCKED_COUNTRIES.map(c => c.code);

// Messages shown to blocked users
export const BLOCK_MESSAGES = {
  title: 'Service Unavailable in Your Region',
  description: 'CalendarPal is not available in your region due to regulatory requirements and compliance policies.',
  support: 'If you believe this is an error or you are traveling, please contact our support team for assistance.',
  contactEmail: 'support@calendarpal.com',
} as const;

// Check if a country code is blocked
export function isCountryBlocked(countryCode: string): boolean {
  return BLOCKED_COUNTRY_CODES.includes(countryCode.toUpperCase());
}

// Get the reason for blocking a country
export function getBlockReason(countryCode: string): string | null {
  const country = BLOCKED_COUNTRIES.find(c => c.code === countryCode.toUpperCase());
  if (!country) return null;
  
  switch (country.reason) {
    case 'ofac':
      return 'Regulatory compliance requirements';
    case 'high_risk':
      return 'Security and fraud prevention';
    case 'payment':
      return 'Payment processing restrictions';
    case 'data_privacy':
      return 'Data privacy regulations';
    default:
      return 'Regulatory requirements';
  }
}
