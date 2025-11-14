const Decimal = require("decimal.js");
const {
  getFromRedis,
  saveToRedis,
  generateToken,
  verifyToken,
} = require("@wc/common-service");
const { REDIS_KEYS } = require("../applicationConstants");

/**
 * Calculate interest and maturity on ₹1L using your logic with Decimal.js
 * @param {number} maturityValue - maturity value for ₹5000 FD (e.g., 5565)
 * @returns {object} { interestOnOneLakh, maturityOnOneLakh }
 */
function calculateInterestOn1LakhCumulative({ maturityValue }) {
  const maturityValueFor5000 = new Decimal(maturityValue);
  const fiveThousand = new Decimal(5000);
  const hundredThousand = new Decimal(100000);

  const interestFor5000 = maturityValueFor5000.minus(fiveThousand);
  const interestOn1Lakh = interestFor5000
    .mul(hundredThousand)
    .div(fiveThousand);

  return interestOn1Lakh.toFixed(2);
}

/**
 * One universal formula for interest on ₹1Lakh (non-cumulative)
 * @param {number} interestRate - Annual rate (e.g., 7.16)
 * @param {number} tenureMonths - FD duration in months (e.g., 12)
 * @returns {number} interestOnOneLakh
 */
function calculateInterestOn1LakhNonCumulative({ interestRate, tenureMonths }) {
  return new Decimal(100000)
    .mul(interestRate)
    .mul(tenureMonths)
    .div(12 * 100)
    .toDecimalPlaces(2)
    .toNumber();
}

function generateFdSubtitle({ fd }) {
  const {
    forSenior,
    forWomen,
    cumulative,
    payoutType,
    tenureMonths,
    effectiveYield,
    lockInPeriodInMonths,
  } = fd;

  const subtitles = [];

  // Priority A: Campaign-style first line (Max 1)

  // if (isLimitedOffer) {
  //   subtitles.push("Limited-Time Special Offer");
  // } else
  // if (hasStrongTrackRecord) {
  // subtitles.push("Strong Track Record");
  // } else if (isTrustedBrand) {
  //   subtitles.push("Trusted by Millions");
  // } else

  if (forSenior || forWomen) {
    if (forSenior && forWomen) {
      subtitles.push("Senior Women");
    } else if (forSenior) {
      subtitles.push("Senior Benefits");
    } else if (forWomen) {
      subtitles.push("Women Special");
    }
  } else {
    if (effectiveYield > 8.5 && !subtitles.includes("Great Returns")) {
      subtitles.unshift("Great Returns");
    } else if (tenureMonths <= 12) {
      subtitles.push("Quick Maturity");
    } else if (lockInPeriodInMonths === 0) {
      subtitles.push("Instant Withdrawal");
    } else if (cumulative) {
      subtitles.push("Compounding Growth");
    } else if (payoutType === "MONTHLY") {
      subtitles.push("Monthly Income");
    } else if (payoutType === "AT_MATURITY") {
      subtitles.push("Lump Sum");
    } else {
      subtitles.push("Safe Returns");
    }
  }

  return subtitles.slice(0, 1).join(" · ");
}
function formatTenureToYearsMonths({ tenureMonths }) {
  const years = Math.floor(tenureMonths / 12);
  const months = tenureMonths % 12;

  const yearStr = years > 0 ? `${years} Year${years > 1 ? "s" : ""}` : "";
  const monthStr = months > 0 ? `${months} Month${months > 1 ? "s" : ""}` : "";

  return [yearStr, monthStr].filter(Boolean).join(" ");
}

function generateBondSubtitle({ bond }) {
  const {
    category,
    rating,
    effectiveYield,
    tenureMonths,
    financeProductType,
  } = bond;

  const subtitles = [];

  // Bond-specific subtitle generation
  if (category) {
    subtitles.push(category.toUpperCase());
  }

  if (rating && rating !== "Unrated") {
    subtitles.push(rating);
  }

  if (effectiveYield > 12) {
    subtitles.push("High Returns");
  } else if (effectiveYield > 10) {
    subtitles.push("Good Returns");
  } else {
    subtitles.push("Safe Returns");
  }

  if (tenureMonths <= 12) {
    subtitles.push("Short Term");
  } else if (tenureMonths > 36) {
    subtitles.push("Long Term");
  }

  return subtitles.slice(0, 2).join(" · ");
}
/**
 * Get user token from Redis or generate a new one if not present
 * @param {string} userId - The user ID to get/generate token for
 * @returns {Promise<string>} The user token
 * @throws {Error} If user details are not found in Redis
 */
async function getUserToken(userId) {
  const userKey = `WC_USER_TOKEN:${userId}`;
  let redisToken = await getFromRedis(userKey);
  let isTokenValid = false;

  // Verify token if it exists in Redis
  if (redisToken) {
    try {
      const verifiedUser = await verifyToken(redisToken);
      if (verifiedUser) {
        isTokenValid = true;
        console.log(`Token verified successfully for user ${userId}`);
      } else {
        // Token is expired or invalid (verifyToken returns null for expired tokens)
        console.log(
          `Token verification failed for user ${userId} - token expired or user mismatch`
        );
        isTokenValid = false;
        // Clear the expired token from Redis
        redisToken = null;
      }
    } catch (error) {
      console.log(
        `Token verification failed for user ${userId}:`,
        error.message
      );
      isTokenValid = false;
      // Clear the invalid token from Redis
      redisToken = null;
    }
  }

  // Generate new token if not present in Redis or verification failed
  if (!isTokenValid || !redisToken) {
    // Get user details to generate token
    const userDetails = await getFromRedis(
      `${REDIS_KEYS.WC_USER_DETAILS(userId)}`
    );

    if (userDetails) {
      const parsedUserDetails =
        typeof userDetails === "string" ? JSON.parse(userDetails) : userDetails;

      redisToken = generateToken({ user: parsedUserDetails });
      await saveToRedis(userKey, redisToken); // 7 days expiry

      console.log(`Generated new token for user ${userId}`);
    } else {
      console.error(`User details not found for userId: ${userId}`);
      throw new Error("User details not found. Cannot generate token.");
    }
  }

  return redisToken;
}

module.exports = {
  calculateInterestOn1LakhCumulative,
  calculateInterestOn1LakhNonCumulative,
  generateFdSubtitle,
  formatTenureToYearsMonths,
  generateBondSubtitle,
  getUserToken,
};
