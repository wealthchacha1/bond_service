/**
 * Service for handling Bond operations using Grip Bond Service.
 * Includes methods for fetching, recommending, and comparing bonds.
 */
const Bond = require("../models/bondsSchema");
const {
  BOND_STATUS,
} = require("../applicationConstants");
const { saveAdminLog, saveAuthLog } = require("../utils/auditLogs");

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
      const bond = await Bond.findOne({ id: id, status: BOND_STATUS.ACTIVE });
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
