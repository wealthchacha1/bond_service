const STATUS_CODES = {
  BAD_REQUEST: 400,
  CONFLICT: 409,
  CREATED: 201,
  NOT_ACCEPTABLE: 406,
  NOT_AUTHENTICATED: 401,
  NOT_AUTHORISED: 403,
  NOT_FOUND: 404,
  OK: 200,
  RESOURCE_CREATED: 201,
  SERVER_ERROR: 500,
  TOO_MANY_REQUESTS: 429,
};
const REDIS_KEYS = {
  WC_USER_DETAILS: (userId) => `WC_USER_DETAILS:${userId}`,
  MESSAGE_NAME: (name) => `MESSAGE.NAME=${name}`,
  FD_LIST: "FD_LIST", // Key for popular FDs cache
  FC_LIST: "FC_LIST", // Key for finance companies cache
  WC_FDID: (fdId) => `WC_FDID:${fdId}`, // Key for individual FD details
};

const GENDER = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
};
const GENDER_ENUM = Object.values(GENDER);

const AGE_GROUPS = {
  UNDER_60: "under-60",
  SENIOR: "60-and-above",
};
const AGE_GROUPS_ENUM = Object.values(AGE_GROUPS);

const TENURE = {
  SHORT: "short-term",
  MEDIUM: "medium-term",
  LONG: "long-term",
  FLEXIBLE: "flexible",
};
const TENURE_ENUM = Object.values(TENURE);
const payoutTypeMapping = {
  ANNUALLY: "Yearly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  HALF_YEARLY: "Half-Yearly",
};

const SHRIRAM_FINANCE_CONSTANTS = {
  MIN_AMOUNT: 5000,
  MAX_AMOUNT: 999999999,
  LOCK_IN_PERIOD_IN_MONTHS: 6, // Example lock-in period
  LOCK_IN_PERIOD: "6 Months", // Example lock-in period in string format
  RATING: "AA", // Example rating for Shriram Finance
  SENIOR_ADDITIONAL_RATE: 0.5, // Additional rate for senior citizens
  WOMEN_ADDITIONAL_RATE: 0.1, // Additional rate for women
};
const MAHINDRA_FINANCE_CONSTANTS = {
  MIN_AMOUNT: 5000,
  MAX_AMOUNT: 999999999,
  LOCK_IN_PERIOD_IN_MONTHS: 3, // Example lock-in period
  LOCK_IN_PERIOD: "3 Months", // Example lock-in period in string format
  RATING: "AAA", // Example rating for Mahindra Finance
  SENIOR_ADDITIONAL_RATE: 0.25, // Additional rate for senior citizens
  WOMEN_ADDITIONAL_RATE: 0, // Additional rate for women
};

const UNITY_FINANCE_CONSTANTS = {
  MIN_AMOUNT: 5000,
  MAX_AMOUNT: 99999999,
  LOCK_IN_PERIOD_IN_MONTHS: 0,
  LOCK_IN_PERIOD: "No Lock-in",
  RATING: "A+",
  SENIOR_ADDITIONAL_RATE: 0.5,
  WOMEN_ADDITIONAL_RATE: 0.25,
  MIN_TENURE_MONTHS: 12,
  MAX_TENURE_MONTHS: 120,
};
const SURYODAY_FINANCE_CONSTANTS = {
  //TODO: need to change data according to suryoday this is copy of unity
  MIN_AMOUNT: 5000,
  MAX_AMOUNT: 99999999,
  LOCK_IN_PERIOD_IN_MONTHS: 0,
  LOCK_IN_PERIOD: "No Lock-in",
  RATING: "A+",
  SENIOR_ADDITIONAL_RATE: 0.5,
  WOMEN_ADDITIONAL_RATE: 0.25,
  MIN_TENURE_MONTHS: 12,
  MAX_TENURE_MONTHS: 120,
};
const BAJAJ_FINANCE_CONSTANTS = {
  //TODO: need to change data according to bajaj this is copy of unity
  MIN_AMOUNT: 5000,
  MAX_AMOUNT: 99999999,
  LOCK_IN_PERIOD_IN_MONTHS: 0,
  LOCK_IN_PERIOD: "No Lock-in",
  RATING: "A+",
  SENIOR_ADDITIONAL_RATE: 0.5,
  WOMEN_ADDITIONAL_RATE: 0.25,
  MIN_TENURE_MONTHS: 12,
  MAX_TENURE_MONTHS: 120,
};

const FINANCE_COMPANY_NAMES = {
  SHRIRAM_FINANCE: "Shriram Finance Company",
  MAHINDRA_FINANCE: "Mahindra Finance Company",
  UNITY_BANK: "Unity Small Finance Bank",
  BAJAJ_FINANCE: "Bajaj Finance Ltd",
  SURYODAY_FINANCE: "Suryoday Small Finance Bank",
  // ...other finance companies
};
const FINANCE_CONSTANTS_MAP = {
  [FINANCE_COMPANY_NAMES.SHRIRAM_FINANCE]: SHRIRAM_FINANCE_CONSTANTS,
  [FINANCE_COMPANY_NAMES.MAHINDRA_FINANCE]: MAHINDRA_FINANCE_CONSTANTS,
  [FINANCE_COMPANY_NAMES.UNITY_BANK]: UNITY_FINANCE_CONSTANTS,
  [FINANCE_COMPANY_NAMES.BAJAJ_FINANCE]: BAJAJ_FINANCE_CONSTANTS,
  [FINANCE_COMPANY_NAMES.SURYODAY_FINANCE]: SURYODAY_FINANCE_CONSTANTS,
};
const additionalBenefits = {
  senior: "Additional 0.50% p.a.",
  women: "Additional 0.10% p.a.",
};

const PAYOUT_TYPES_ENUM = [
  "ANNUALLY",
  "MONTHLY",
  "QUARTERLY",
  "AT_MATURITY",
  "HALF_YEARLY",
];

const USER_FILTER_OPTIONS = {
  REGULAR: "regular-investor",
  SENIOR: "senior-citizen",
  WOMEN: "women-investor",
};
const USER_FILTER_OPTIONS_ENUM = Object.values(USER_FILTER_OPTIONS);

const CRON_SCHEDULES = {
  // Key by normalized company name for easy lookup
  "shriram finance company": "0 12 * * *", // Daily at 12:00 PM
  "mahindra finance company": "0 13 * * *", // Daily at 1:00 PM
  "unity small finance bank": "0 14 * * *", // Daily at 2:00 PM
  "bajaj finance company": "0 15 * * *", // Daily at 3:00 PM
  "suryoday small finance bank": "0 16 * * *", // Daily at 4:00 PM
};

const BOND_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

module.exports = {
  STATUS_CODES,
  REDIS_KEYS,
  GENDER,
  GENDER_ENUM,
  AGE_GROUPS,
  AGE_GROUPS_ENUM,
  TENURE,
  TENURE_ENUM,
  payoutTypeMapping,
  SHRIRAM_FINANCE_CONSTANTS,
  MAHINDRA_FINANCE_CONSTANTS,
  UNITY_FINANCE_CONSTANTS,
  BAJAJ_FINANCE_CONSTANTS,
  SURYODAY_FINANCE_CONSTANTS,
  PAYOUT_TYPES_ENUM,
  USER_FILTER_OPTIONS,
  USER_FILTER_OPTIONS_ENUM,
  CRON_SCHEDULES,
  FINANCE_COMPANY_NAMES,
  FINANCE_CONSTANTS_MAP,
  additionalBenefits,
  BOND_STATUS,
};
