const BondService = require("../services/bondService");
const { sendSuccess, sendError } = require("../utils/response");
const mongoose = require("mongoose");
const { calculateBondSchema } = require("../validators/validator");
const Bond = require("../models/bondsSchema");
const Decimal = require("decimal.js");

const {
  getFromRedis,
  decrypt,
  getFCByIdOrName,
  verifyToken,
  saveToRedis,
} = require("@wc/common-service");
const {
  REDIS_KEYS,
  BOND_STATUS,
} = require("../applicationConstants");

const {
  generateBondSubtitle,
  formatTenureToYearsMonths,
} = require("../utils/helper");

class BondController {
  constructor(fastifyLogger) {
    this.bondService = new BondService(fastifyLogger);
    // Bind only user-facing APIs
    this.getBondById = this.getBondById.bind(this);
    this.getChachaPicks = this.getChachaPicks.bind(this);
    this.getBestByIssuer = this.getBestByIssuer.bind(this);
    this.getBondListByType = this.getBondListByType.bind(this);
    this.getIssuerPopularBondList = this.getIssuerPopularBondList.bind(this);
    this.getChachaCompares = this.getChachaCompares.bind(this);
    this.getRecommendedBonds = this.getRecommendedBonds.bind(this);
    this.compareBonds = this.compareBonds.bind(this);
    this.calculateBond = this.calculateBond.bind(this);
    this.getSuggestedBonds = this.getSuggestedBonds.bind(this);
    this.getAllGripBonds = this.getAllGripBonds.bind(this);
    this.getBondDetails = this.getBondDetails.bind(this);
    this.getKYCUrl = this.getKYCUrl.bind(this);
    this.createGripUser = this.createGripUser.bind(this);
    this.getAllBonds = this.getAllBonds.bind(this);
  }

  // Validate and sanitize input, handle errors securely
  async getBondById(request, reply) {
    try {
      //check if id is mongoose id
      if (!mongoose.Types.ObjectId.isValid(request.params.bondId)) {
        return sendError({ reply, message: "Invalid Bond id", statusCode: 400 });
      }
      const bond = await this.bondService.getBondById({
        id: request.params.bondId.toString(),
      });
      const data = [bond];
      if (!bond)
        return sendError({ reply, message: "Bond not found", statusCode: 404 });
      sendSuccess({ reply, message: "Bond fetched", data });
    } catch (err) {
      reply.log.error({ err }, "Error in getBondById");
      sendError({ reply, message: err.message, statusCode: 400 });
    }
  }

  async getChachaPicks(request, reply) {
    try {
      const userId = request.userId;
      if (userId && typeof userId !== "string" && typeof userId !== "number") {
        return sendError({ reply, message: "Invalid userId", statusCode: 400 });
      }
      const bonds = await this.bondService.getChachaPicks({ userId });
      sendSuccess({ reply, message: "Chacha Picks fetched", data: bonds });
    } catch (err) {
      reply.log.error({ err }, "Error in getChachaPicks");
      sendError({ reply, message: err.message, statusCode: 400 });
    }
  }

  async getBestByIssuer(request, reply) {
    try {
      const bonds = await this.bondService.getBestByIssuer();
      sendSuccess({ reply, message: "Best by Issuer Bonds fetched", data: bonds });
    } catch (err) {
      reply.log.error({ err }, "Error in getBestByIssuer");
      sendError({ reply, message: err.message, statusCode: 400 });
    }
  }

  async getBondListByType(request, reply) {
    try {
      const { type, userId, limit, page } = request.query;
      if (!type || typeof type !== "string") {
        return sendError({
          reply,
          message: "Invalid Bond type",
          statusCode: 400,
        });
      }
      const { data, totalBonds, totalPages } =
        await this.bondService.getBondListByType({
          type,
          userId,
          limit,
          page,
        });
      sendSuccess({
        reply,
        message: `Bonds for type ${type} fetched`,
        data,
        extraData: { totalBonds, totalPages },
      });
    } catch (err) {
      reply.log.error({ err }, "Error in getBondListByType");
      sendError({ reply, message: err.message, statusCode: 400 });
    }
  }

  async getIssuerPopularBondList(request, reply) {
    try {
      const {
        financeCompanyId,
        limit = 4,
        page = 1,
        filter = "regular-investor",
      } = request.query;

      let forSenior = false;
      let forWomen = false;
      let forRegular = false;

      if (!financeCompanyId || typeof financeCompanyId !== "string") {
        return sendError({
          reply,
          message: "Invalid or missing financeCompanyId",
          statusCode: 400,
        });
      }
      // check from redis fc list if this id present
      const fcCompanyDetails = await getFCByIdOrName({ financeCompanyId });
      if (!fcCompanyDetails) {
        return sendError({
          reply,
          message: "Invalid or missing financeCompanyId",
          statusCode: 400,
        });
      }

      if (request.gender?.toLowerCase() === "female") {
        forWomen = true;
      } else {
        forRegular = true;
      }

      if (filter !== "regular-investor") {
        forSenior = true;
        if (request.gender?.toLowerCase() !== "female") {
          forRegular = false;
        }
      }

      console.log("User Characteristics:", { forWomen, forSenior, forRegular });
      const query = {
        financeCompanyId,
        limit,
        page,
        filter,
        forWomen,
        forSenior,
        forRegular,
      };
      const { modifiedBonds, totalBonds, totalPages } =
        await this.bondService.getIssuerPopularBondList(query);

      sendSuccess({
        reply,
        message: "Issuer popular Bonds fetched",
        data: modifiedBonds,
        extraData: { totalBonds, totalPages },
      });
    } catch (err) {
      reply.log.error({ err }, "Error in getIssuerPopularBondList");
      sendError({ reply, message: err.message, statusCode: 400 });
    }
  }

  async getChachaCompares(request, reply) {
    try {
      const { compareBonds, bondChachaTip } =
        await this.bondService.getChachaCompares({
          bondId: request.query.bondId,
        });
      sendSuccess({
        reply,
        message: "Chacha compares fetched",
        data: compareBonds,
        extraData: { bondChachaTip },
      });
    } catch (err) {
      reply.log.error({ err }, "Error in getChachaCompares");
      sendError({ reply, message: err.message, statusCode: 400 });
    }
  }

  async getRecommendedBonds(request, reply) {
    try {
      const userId = request.user?.id || request.query.userId;
      const bonds = await this.bondService.getRecommendedBonds({ userId, request });
      sendSuccess({ reply, message: "Recommended Bonds fetched", data: bonds });
    } catch (err) {
      reply.log.error({ err }, "Error in getRecommendedBonds");
      sendError({ reply, message: err.message, statusCode: 400 });
    }
  }

  async compareBonds(request, reply) {
    try {
      if (!request.query || !Array.isArray(request.query.bondIds)) {
        return sendError({
          reply,
          message: "Invalid or missing bondIds",
          statusCode: 400,
        });
      }
      console.log("Comparing Bonds with IDs:", request.query.bondIds);
      const { bondIds } = request.query;
      if (!Array.isArray(bondIds)) {
        return sendError({
          reply,
          message: "Invalid format for Bond IDs",
          statusCode: 400,
        });
      }

      const { activeBonds, inactiveBonds, notFoundIds } =
        await this.bondService.compareBonds({
          bondIds,
        });
      let message = "Bonds comparison fetched";

      if (activeBonds.length < 2) {
        message = "Insufficient active Bonds for comparison";
      }
      if (notFoundIds.length > 0) {
        message += " with some not found IDs: " + notFoundIds.join(", ");
      }
      if (inactiveBonds.length > 0) {
        message += " with some inactive Bonds: " + inactiveBonds.join(", ");
      }
      sendSuccess({
        reply,
        message,
        data: activeBonds,
      });
    } catch (err) {
      reply.log.error({ err }, "Error in compareBonds");
      sendError({
        reply,
        message: err.message || "Internal server error",
        statusCode: 400,
      });
    }
  }

  async getSuggestedBonds(request, reply) {
    try {
      const bonds = await this.bondService.getSuggestedBonds({ request });
      sendSuccess({ reply, message: "Suggested Bonds fetched", data: bonds });
    } catch (err) {
      reply.log.error({ err }, "Error in getSuggestedBonds");
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

  async getAllGripBonds(request, reply) {
    try {
      const result = await this.bondService.getAllGripBonds();
      sendSuccess({
        reply,
        message: "All Grip Bonds fetched successfully",
        data: result,
      });
    } catch (err) {
      reply.log.error({ err }, "Error in getAllGripBonds");
      sendError({
        reply,
        message: err.message || "Bond fetching failed",
        statusCode: 400,
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

  async getKYCUrl(request, reply) {
    try {
      const { username, assetId } = request.query;
      if (!username || !assetId) {
        return sendError({
          reply,
          message: "Missing required parameters: username, assetId",
          statusCode: 400,
        });
      }
      const { redirectUrl } = await this.bondService.getKYCUrl({
        username,
        assetId,
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

      const { emailID, phoneNumber, firstName, lastName, countryCode = 91 } = userData;

      if (!emailID || !phoneNumber || !firstName || !lastName) {
        return sendError({
          reply,
          message: "Missing required fields: emailID, phoneNumber, firstName, lastName",
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
}

module.exports = BondController;