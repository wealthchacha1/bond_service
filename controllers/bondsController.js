const BondService = require("../services/bondService");
const { sendSuccess, sendError } = require("../utils/response");
const mongoose = require("mongoose");
const BondCategory = require("../models/bondsCategories");
const axios = require("axios");
const { getFromRedis } = require("@wc/common-service");
const { REDIS_KEYS } = require("../applicationConstants");

class BondController {
  constructor(fastifyLogger) {
    this.bondService = new BondService(fastifyLogger);
    // Bind only user-facing APIs
    this.getBondById = this.getBondById.bind(this);
    this.calculateBond = this.calculateBond.bind(this);
    this.getKYCUrl = this.getKYCUrl.bind(this);
    this.createGripUser = this.createGripUser.bind(this);
    this.getAllBonds = this.getAllBonds.bind(this);
    this.getAllBondsFromDB = this.getAllBondsFromDB.bind(this);
    this.getKYCStatus = this.getKYCStatus.bind(this);
    this.getCheckoutUrl = this.getCheckoutUrl.bind(this);
  }

  // Validate and sanitize input, handle errors securely
  async getBondById(request, reply) {
    try {
      const bond = await this.bondService.getBondById({
        id: request.params.bondId,
      });
      const calculatorData = await this.bondService.calculateBond({
        username: process.env.WC_GRIP_USERNAME,
        assetId: request.params.bondId,
        amount: 1,
      });
      const finalResult = {
        ytm: bond.interestRate,
        remainingTenure: bond.originalData.TimeToMaturity,
        rating: bond.rating,
        tags: bond.badges,
        logo: bond.logo,
        financeCompanyName: bond.financeCompanyName,
        description: bond.description,
        maxInvestment: calculatorData.assetCalcDetails.maxInvestment,
        completedPercentage: bond.originalData.percentageCompletion,
        perUnitPurchasePrice: calculatorData.assetCalcDetails.purchasePrice,
        perUnitReturnAmount: calculatorData.assetCalcDetails.preTaxReturns,
        maxUnits: calculatorData.assetCalcDetails.maxLots,
      };
      sendSuccess({ reply, message: "Bond fetched", data: finalResult });
    } catch (err) {
      reply.log.error({ err }, "Error in getBondById");
      sendError({ reply, message: err.message, statusCode: 400 });
    }
  }

  async calculateBond(request, reply) {
    try {
      const bondInput = request.body;
      console.log("Bond Input for calculation:", bondInput);

      if (!bondInput || typeof bondInput !== "object") {
        return sendError({
          reply,
          message: "Invalid input: bondInput is required",
          statusCode: 400,
        });
      }

      const { username, assetId, amount } = bondInput;

      if (!username || !assetId) {
        return sendError({
          reply,
          message: "Missing required parameters: username, assetId",
          statusCode: 400,
        });
      }

      const result = await this.bondService.calculateBond({
        username,
        assetId,
        amount: amount || 10000, // Default amount if not provided
      });

      console.log("Bond Calculation Result:", JSON.stringify(result, null, 2));

      if (!result) {
        throw new Error("No calculation result received from bond service");
      }

      sendSuccess({
        reply,
        message: "Bond calculation successful",
        data: result,
      });
    } catch (err) {
      reply.log.error({ err }, "Error in calculateBond");

      let errorMessage = "Bond calculation failed";
      let statusCode = 400;

      if (err.message) {
        errorMessage = err.message;
      }

      sendError({
        reply,
        message: errorMessage,
        statusCode,
      });
    }
  }

  async getBondDetails(request, reply) {
    try {
      const { bondId } = request.query;
      //mongoose id validation
      if (!mongoose.Types.ObjectId.isValid(bondId)) {
        return sendError({
          reply,
          message: "Invalid Bond ID",
          statusCode: 400,
        });
      }
      const bondDetails = await this.bondService.getBondDetails({
        bondId,
      });

      console.log("Bond Details:", bondDetails);

      // Return the response
      sendSuccess({
        reply,
        message: "Bond details fetched successfully",
        data: bondDetails,
      });
    } catch (err) {
      reply.log.error({ err }, "Error in getBondDetails");
      sendError({
        reply,
        message: err.message || "Failed to fetch bond details",
        statusCode: 500,
      });
    }
  }

  async getKYCStatus(request, reply) {
    try {
      const { userId } = request;
      if (!userId) {
        return sendError({
          reply,
          message: "Missing required parameters: userId",
          statusCode: 400,
        });
      }
      const userDetails = await getFromRedis(
        REDIS_KEYS.WC_USER_DETAILS(userId)
      );
      const username = userDetails.gripUserName;
      if (!username) {
        return sendError({
          reply,
          message: "Please contact support",
          statusCode: 400,
        });
      }
      const status = await this.bondService.getKYCStatus({ username });
      sendSuccess({
        reply,
        message: "KYC status fetched successfully",
        data: status,
      });
    } catch (err) {
      reply.log.error({ err }, "Error in getKYCStatus");
      sendError({
        reply,
        message: err.message || "Failed to fetch KYC status",
        statusCode: 400,
      });
    }
  }

  async getKYCUrl(request, reply) {
    try {
      const { userId } = request;
      const userDetails = await getFromRedis(
        REDIS_KEYS.WC_USER_DETAILS(userId)
      );

      const username = userDetails.gripUserName;
      if (!username) {
        return sendError({
          reply,
          message: "Please contact support",
          statusCode: 400,
        });
      }
      const { redirectUrl } = await this.bondService.getKYCUrl({
        username
      });
      sendSuccess({
        reply,
        message: "KYC URL generated successfully",
        data: {
          redirectUrl,
        },
      });
    } catch (err) {
      reply.log.error({ err }, "Error in getKYCUrl");
      sendError({
        reply,
        message: err.message || "Failed to generate KYC URL",
        statusCode: 400,
      });
    }
  }

  async getCheckoutUrl(request, reply) {
    try {
      const { userId } = request;
      const userDetails = await getFromRedis(
        REDIS_KEYS.WC_USER_DETAILS(userId)
      );
      const username = userDetails.gripUserName;
      const { assetId, amount } = request.query;
      if (!username || !assetId || !amount) {
        return sendError({
          reply,
          message: "Missing required parameters: username, assetId, amount",
          statusCode: 400,
        });
      }
      const result = await this.bondService.getCheckoutUrl({
        username,
        assetId,
        amount,
      });
      sendSuccess({
        reply,
        message: "Checkout URL generated successfully",
        data: {
          checkoutUrl: result,
        },
      });
    } catch (err) {
      reply.log.error({ err }, "Error in getCheckoutUrl");
      sendError({
        reply,
        message: err.message || "Failed to generate checkout URL",
        statusCode: 400,
      });
    }
  }

  async createGripUser(request, reply) {
    try {
      const userData = request.body;
      if (!userData || typeof userData !== "object") {
        return sendError({
          reply,
          message: "Invalid input: userData is required",
          statusCode: 400,
        });
      }

      const {
        emailID,
        phoneNumber,
        firstName,
        lastName,
        countryCode = 91,
      } = userData;

      if (!emailID || !phoneNumber || !firstName || !lastName) {
        return sendError({
          reply,
          message:
            "Missing required fields: emailID, phoneNumber, firstName, lastName",
          statusCode: 400,
        });
      }

      const result = await this.bondService.createGripUser({
        emailID,
        phoneNumber,
        firstName,
        lastName,
        countryCode,
      });

      console.log("Grip user created successfully", result);

      console.log(
        {
          userId: request.userId,
          gripId: result,
        },
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: request.headers.authorization,
          },
        }
      );
      const response = await axios.post(
        `${process.env.INTERNAL_API_BASE_URL}/auth/update-user-grip-name`,
        {
          userId: request.userId,
          gripId: result,
        },
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: request.headers.authorization,
          },
        }
      );

      console.log("User Grip name updated successfully", response.data);

      sendSuccess({
        reply,
        message: "Grip user created successfully",
        data: result,
      });
    } catch (err) {
      reply.log.error({ err }, "Error in createGripUser");
      sendError({
        reply,
        message: err.message || "Failed to create Grip user",
        statusCode: 400,
      });
    }
  }

  async getAllBonds(request, reply) {
    try {
      const bonds = await this.bondService.getAllBonds();
      sendSuccess({
        reply,
        message: "All bonds fetched successfully",
        data: bonds,
      });
    } catch (err) {
      reply.log.error({ err }, "Error in getAllBonds");
      sendError({
        reply,
        message: err.message || "Failed to fetch bonds",
        statusCode: 500,
      });
    }
  }

  async getAllBondsFromDB(request, reply) {
    try {
      const { type, limit, page } = request.query;
      const query = {};
      let bonds, totalBonds, data;

      if (type) {
        const category = await BondCategory.findOne({
          categoryName: type,
        }).populate("bondIds");
        const skip = (page - 1) * limit;

        if (!category || !category.bondIds) {
          return sendError({
            reply,
            message: "Invalid Bond type",
            statusCode: 400,
          });
        }

        if (category) {
          bonds = category.bondIds.slice(skip, skip + limit);
          totalBonds = category.bondIds.length || 0;
        }
      } else {
        data = await this.bondService.getAllBondsFromDB({ query, limit, page });
      }

      sendSuccess({
        reply,
        message: "All bonds fetched successfully",
        data: bonds || data?.bonds,
        extraData: {
          totalBonds: totalBonds || data?.totalBonds || 0,
          totalPages: Math.ceil(totalBonds / limit) || data?.totalPages,
        },
      });
    } catch (err) {
      reply.log.error({ err }, "Error in getAllBonds");
      sendError({
        reply,
        message: err.message || "Failed to fetch bonds",
        statusCode: 500,
      });
    }
  }
}

module.exports = BondController;
