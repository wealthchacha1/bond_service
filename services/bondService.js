/**
 * Service for handling Bond operations using Grip Bond Service.
 * Includes methods for fetching, recommending, and comparing bonds.
 */
const Bond = require("../models/bondsSchema");
const { getFromRedis, getFCByIdOrName } = require("@wc/common-service");
const {
  REDIS_KEYS,
  AGE_GROUPS,
  GENDER,
  TENURE,
  BOND_STATUS,
  USER_FILTER_OPTIONS,
} = require("../applicationConstants");
const { saveAdminLog, saveAuthLog } = require("../utils/auditLogs");
const { formatTenureToYearsMonths } = require("../utils/helper");

// Import Grip Finance Service
const { GripFinanceService } = require("@fc/grip_bond_service");

class BondService {
  constructor(logger) {
    this.logger = logger;
    this.counter = 1;
    this.gripService = new GripFinanceService();
  }

  async getAllBondsFromDB({ query = {}, limit = 4, page = 1 }) {
    const skip = (page - 1) * limit;
    const bonds = await Bond.find(query).skip(skip).limit(limit).exec();
    const totalBonds = (await Bond.countDocuments(query)) || 0;
    const totalPages = Math.ceil(totalBonds / limit);
    console.log(totalPages);
    return { bonds, totalBonds, totalPages };
  }

  async getAllBonds() {
    const bonds = await this.gripService.getAllBonds(
      "68cc07d2b56f2c5b52a0d1b0"
    );
    return bonds;
  }

  /**
   * Fetch Bond by ID.
   * @param {Object} params - Parameters containing Bond ID.
   * @returns {Promise<Object>} - Bond record.
   */
  async getBondById({ id }) {
    // this.logger.info({ id }, "Fetching Bond by ID");
    try {
      const bond = await Bond.findOne({ _id: id, status: BOND_STATUS.ACTIVE });
      if (!bond) {
        // this.logger.warn({ id }, "Bond not found or inactive");
        throw new Error("Bond not found or inactive");
      }
      // this.logger.info(bond + " Bond fetched successfully");
      return bond;
    } catch (error) {
      // this.logger.error({ error, id }, "Error fetching Bond by ID");
      throw error;
    }
  }

  /**
   * Get personalized Bonds for user.
   * @param {string} userId - User ID.
   * @returns {Promise<Array>} - List of personalized Bonds.
   */
  async getChachaPicks({ userId, limit = 4, page = 1 }) {
    const skip = (page - 1) * limit;
    this.logger.info({ userId }, "Fetching Chacha Picks");
    let userDetails;
    const projection = {
      _id: 1,
      financeCompanyId: 1,
      financeCompanyName: 1,
      logo: 1,
      schemeName: 1,
      interestRate: 1,
      rateUnit: 1,
      rating: 1,
      effectiveYield: 1,
      tenureMonths: 1,
      tenureLabel: 1,
      minAmount: 1,
      maxAmount: 1,
      financeProductType: 1,
      category: 1,
      subtitle: 1,
    };
    try {
      const userRaw = await getFromRedis(REDIS_KEYS.WC_USER_DETAILS(userId));
      if (!userRaw) {
        this.logger.warn({ userId }, "User details not found in Redis");
        const data = {
          data: await Bond.find({
            status: BOND_STATUS.ACTIVE,
          })
            .select(projection)
            .sort({ effectiveYield: -1 })
            .skip(skip)
            .limit(limit)
            .exec(),
          totalBonds: await Bond.countDocuments({
            status: BOND_STATUS.ACTIVE,
          }),
          totalPages: 0,
        };
        data.totalPages = Math.ceil(data.totalBonds / limit);
        console.log({ data });
        return data;
      }
      userDetails = JSON.parse(userRaw);
    } catch (err) {
      this.logger.error(
        { err, userId },
        "Error fetching user details from Redis"
      );
      const data = await Bond.find({ status: BOND_STATUS.ACTIVE })
        .select(projection)
        .sort({ effectiveYield: -1 })
        .skip(skip)
        .limit(limit)
        .exec();
      const totalBonds = await Bond.countDocuments({
        status: BOND_STATUS.ACTIVE,
      });
      const totalPages = Math.ceil(totalBonds / limit);
      return { data, totalBonds, totalPages };
    }

    const query = { status: BOND_STATUS.ACTIVE };
    const userAge = userDetails.dob
      ? new Date().getFullYear() - new Date(userDetails.dob).getFullYear()
      : null;

    // For bonds, we don't have senior/women specific flags like FDs
    // So we'll just return popular bonds based on yield
    this.logger.info({ query }, "Query for Chacha Picks");
    const data = await Bond.find(query)
      .select(projection)
      .sort({ effectiveYield: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    const totalBonds = await Bond.countDocuments(query);
    const totalPages = Math.ceil(totalBonds / limit);
    return { data, totalBonds, totalPages };
  }

  /**
   * Get Bonds by type (high-returns, short-term, long-term, etc.)
   * @param {string} type - Type of Bond to fetch.
   * @param {string} userId - User ID for personalized picks.
   * @returns {Promise<Array>} - List of Bonds matching the criteria.
   */
  async getBondListByType({ type, userId, limit = 4, page = 1 }) {
    const skip = (page - 1) * limit;
    const baseQuery = { status: BOND_STATUS.ACTIVE };
    let filterQuery = {};
    let sortQuery = {};
    let selectedModel = Bond; // Default model

    // Bond-specific filtering logic
    switch (type) {
      case "high-returns":
        filterQuery = baseQuery;
        sortQuery = { effectiveYield: -1 };
        break;

      case "short-term":
        filterQuery = { ...baseQuery, tenureMonths: { $lte: 12 } };
        sortQuery = { tenureMonths: 1, effectiveYield: -1 };
        break;

      case "long-term":
        filterQuery = { ...baseQuery, tenureMonths: { $gt: 12 } };
        sortQuery = { tenureMonths: 1 };
        break;

      case "chacha-picks":
        const chachaData = await this.getChachaPicks({
          userId,
          limit,
          page,
        });
        return {
          data: chachaData.data,
          totalBonds: chachaData.totalBonds,
          totalPages: chachaData.totalPages,
        };

      case "newly-added":
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filterQuery = { ...baseQuery, createdAt: { $gte: thirtyDaysAgo } };
        sortQuery = { createdAt: -1 };
        break;

      default:
        throw new Error("Invalid Bond type");
    }

    const [data, totalBonds] = await Promise.all([
      selectedModel
        .find(filterQuery)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .exec(),
      selectedModel.countDocuments(filterQuery),
    ]);

    return {
      data,
      totalBonds,
      totalPages: Math.ceil(totalBonds / limit),
    };
  }

  /**
   * Get popular Bonds for a specific issuer.
   * @param {Object} params - Parameters containing finance company ID, pagination, and filter.
   * @returns {Promise<Array>} - List of popular Bonds for the issuer.
   */
  async getIssuerPopularBondList({
    financeCompanyId,
    limit = 4,
    page = 1,
    filter = "regular-investor",
    forWomen = false,
    forSenior = false,
    forRegular = false,
  }) {
    const fcCompanyDetails = await getFCByIdOrName({ financeCompanyId });
    if (!fcCompanyDetails) {
      throw new Error("Finance company not found in Redis cache");
    }
    console.log(
      "Fetching popular Bonds for finance company:",
      fcCompanyDetails._id
    );
    const query = {
      status: BOND_STATUS.ACTIVE,
      financeCompanyId: fcCompanyDetails._id,
    };

    let totalBonds = await Bond.countDocuments(query).exec();
    console.log({ query, financeCompanyId, filter });
    const bonds = await Bond.find(query)
      .sort({ effectiveYield: -1, tenureMonths: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    //get bond count and pages
    const totalPages = totalBonds ? Math.ceil(totalBonds / limit) : 0;
    console.log("Total Bonds:", totalBonds, "Total Pages:", totalPages);

    const modifiedBonds = bonds.map((bond) => ({
      bondId: bond._id,
      financeCompanyId: bond.financeCompanyId,
      financeCompanyName: bond.financeCompanyName,
      logo: bond.logo,
      schemeName: bond.schemeName,
      tenureMonths: bond.tenureMonths,
      tenureLabel: bond.tenureLabel,
      interestRate: bond.interestRate,
      effectiveYield: bond.effectiveYield,
      minAmount: bond.minAmount,
      maxAmount: bond.maxAmount,
      financeProductType: bond.financeProductType,
      category: bond.category,
      rating: bond.rating,
      subtitle: bond.subtitle,
    }));
    console.log("Fetched Bonds:", modifiedBonds);
    return { modifiedBonds, totalBonds, totalPages };
  }

  /**
   * Get Bond details for comparison.
   * @param {Object} params - Parameters containing Bond ID.
   * @returns {Promise<Object>} - Bond details for comparison.
   */
  async getChachaCompares({ bondId }) {
    if (!bondId) throw new Error("Bond ID is required for comparison");
    console.log("Fetching Bond for comparison:", bondId);
    const bond = await Bond.findOne({
      _id: bondId,
      status: BOND_STATUS.ACTIVE,
    });
    console.log("Fetched Bond for comparison:", bond);
    if (!bond) throw new Error("Bond not found or inactive");

    console.log("Fetching comparison Bonds for:", bond);
    const compareBonds = await Bond.find({
      tenureMonths: bond.tenureMonths,
      financeCompanyId: { $ne: bond.financeCompanyId },
      status: BOND_STATUS.ACTIVE,
    })
      .sort({ effectiveYield: -1 })
      .limit(2)
      .exec();

    compareBonds.push(bond);
    compareBonds.sort((a, b) => b.effectiveYield - a.effectiveYield);
    const bondChachaTip =
      "Bonds offer steady returns with lower risk. The longer you hold, the more predictable your returns become. Consider your investment horizon and risk tolerance when choosing bonds.";
    return { compareBonds, bondChachaTip };
  }

  /**
   * Get recommended Bonds based on user preferences.
   * @param {Object} params - Parameters containing user ID and request body.
   * @returns {Promise<Array>} - List of recommended Bonds.
   */
  async getRecommendedBonds({ userId, request }) {
    const userDetails = await getFromRedis(REDIS_KEYS.WC_USER_DETAILS(userId));
    if (!userDetails || userDetails.status !== BOND_STATUS.ACTIVE) {
      console.log("No user details found for user:", userId);
    }
    const { ageGroup, gender, term, limit, page } = request.body;
    const query = {
      status: BOND_STATUS.ACTIVE,
    };

    if (term) {
      switch (term) {
        case TENURE.SHORT:
          query.tenureMonths = { $lte: 12 };
          break;
        case TENURE.MEDIUM:
          query.tenureMonths = { $gt: 12, $lte: 36 };
          break;
        case TENURE.LONG:
          query.tenureMonths = { $gt: 36 };
          break;
        case TENURE.FLEXIBLE:
          query.tenureMonths = { $exists: true };
          break;
        default:
          throw new Error("Invalid tenure term");
      }
    }
    console.log("Recommended Bond query:::::::::", query);
    const recommendedBonds = await Bond.find(query)
      .sort({ effectiveYield: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    if (!recommendedBonds || recommendedBonds.length === 0) {
      console.log("No recommended Bonds found for user:", userId);
      return [];
    }

    return recommendedBonds;
  }

  /**
   * Compare Bonds based on provided IDs.
   * @param {Object} params - Parameters containing Bond IDs.
   * @returns {Promise<Object>} - Comparison result containing active, inactive Bonds and not found IDs.
   */
  async compareBonds({ bondIds }) {
    const bonds = await Bond.find({ _id: { $in: bondIds } }).exec();

    const foundIds = bonds.map((bond) => bond._id.toString());

    const notFoundIds = bondIds.filter((id) => !foundIds.includes(id));

    const activeBonds = bonds.filter(
      (bond) => bond.status === BOND_STATUS.ACTIVE
    );
    const inactiveBonds = bonds.filter(
      (bond) => bond.status !== BOND_STATUS.ACTIVE
    );

    activeBonds.sort((a, b) => b.interestRate - a.interestRate);

    return {
      activeBonds,
      inactiveBonds: inactiveBonds.map((bond) => bond._id),
      notFoundIds,
    };
  }

  /**
   * Get suggested Bonds based on user request.
   * @param {Object} params - Parameters containing request body.
   * @returns {Promise<Array>} - List of suggested Bonds.
   */
  async getSuggestedBonds({ request }) {
    const { limit = 4, page = 1, amount, tenureMonths } = request.body;
    const query = {
      status: BOND_STATUS.ACTIVE,
    };

    if (amount) {
      query.minAmount = { $lte: amount };
      query.maxAmount = { $gte: amount };
    }
    if (tenureMonths) {
      query.tenureMonths = tenureMonths;
    }

    const suggestedBonds = await Bond.find(query)
      .sort({ effectiveYield: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return suggestedBonds;
  }

  /**
   * Calculate bond returns using Grip service
   * @param {Object} params - Parameters containing username, assetId, amount
   * @returns {Promise<Object>} - Calculation result
   */
  async calculateBond({ username, assetId, amount = 10000 }) {
    try {
      this.logger.info(
        { username, assetId, amount },
        "Calculating bond returns"
      );

      const result = await this.gripService.calculateBonds(username, assetId);

      this.logger.info({ result }, "Bond calculation completed");
      return result;
    } catch (error) {
      this.logger.error({ error, username, assetId }, "Error calculating bond");
      throw error;
    }
  }

  /**
   * Get all bonds from Grip service
   * @returns {Promise<Object>} - All bonds data
   */
  async getAllGripBonds() {
    try {
      this.logger.info("Fetching all bonds from Grip service");

      console.log("Fetching all bonds from Grip service");
      const result = await this.gripService.getAllBonds(
        "68cc07d2b56f2c5b52a0d1b0"
      );
      console.log("Result:::::::::::::", result);
      // this.logger.info({ totalSchemes: result.totalSchemes }, "All bonds fetched");
      console.log("All bonds fetched", result);
      return result;
    } catch (error) {
      this.logger.error({ error }, "Error fetching all bonds");
      console.log("Error fetching all bonds", error);
      throw error;
    }
  }

  /**
   * Get bond details
   * @param {Object} params - Parameters containing bondId
   * @returns {Promise<Object>} - Bond details
   */
  async getBondDetails({ bondId }) {
    try {
      this.logger.info({ bondId }, "Fetching bond details");

      const bond = await Bond.findOne({
        _id: bondId,
        status: BOND_STATUS.ACTIVE,
      });
      if (!bond) {
        throw new Error("Bond not found or inactive");
      }

      return bond;
    } catch (error) {
      this.logger.error({ error, bondId }, "Error fetching bond details");
      console.log("Error fetching bond details", error);
      throw error;
    }
  }

  /**
   * Get KYC URL from Grip service
   * @param {Object} params - Parameters containing username, assetId
   * @returns {Promise<Object>} - KYC URL
   */
  async getKYCUrl({ username, assetId }) {
    try {
      this.logger.info({ username, assetId }, "Getting KYC URL");

      const result = await this.gripService.getRedirectionUrlForKYC(
        username,
        assetId
      );

      this.logger.info({ result }, "KYC URL generated");
      console.log("KYC URL generated", result);
      return result;
    } catch (error) {
      this.logger.error({ error, username, assetId }, "Error getting KYC URL");
      throw error;
    }
  }

  /**
   * Create user in Grip service
   * @param {Object} params - User data
   * @returns {Promise<Object>} - Created user details
   */
  async createGripUser({
    emailID,
    phoneNumber,
    firstName,
    lastName,
    countryCode = 91,
  }) {
    try {
      this.logger.info(
        { emailID, phoneNumber, firstName, lastName },
        "Creating Grip user"
      );

      const userData = {
        emailID,
        phoneNumber,
        firstName,
        lastName,
        countryCode,
      };

      // Generate username from firstName and phoneNumber
      const username = `${firstName.toLowerCase()}${phoneNumber.toString().slice(-4)}`;

      const result = await this.gripService.createGripUser(userData, username);

      this.logger.info({ result }, "Grip user created");
      return result;
    } catch (error) {
      this.logger.error(
        { error, emailID, phoneNumber },
        "Error creating Grip user"
      );
      throw error;
    }
  }

  /**
   * Save admin logs in Redis.
   * @param {Object} logData - Log data to save.
   */
  async saveAdminLog(logData) {
    await saveAdminLog(logData);
  }

  /**
   * Save authentication logs in Redis.
   * @param {Object} logData - Log data to save.
   */
  async saveAuthLog(logData) {
    await saveAuthLog(logData);
  }
}

module.exports = BondService;
