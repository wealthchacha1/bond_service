const BondController = require("../controllers/bondsController");
const BondService = require("../services/bondService");
const BondCategory = require("../models/bondsCategories");
const { getFromRedis } = require("@wc/common-service");
const { sendMessage } = require("@wc/common-service");
const axios = require("axios");
const { getUserToken } = require("../utils/helper");

jest.mock("../services/bondService");
jest.mock("../models/bondsCategories");
jest.mock("@wc/common-service");
jest.mock("axios");
jest.mock("../utils/helper");

describe("BondController", () => {
  let controller;
  let mockReply;
  let mockRequest;

  beforeEach(() => {
    controller = new BondController({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    });
    mockReply = {
      log: {
        error: jest.fn(),
      },
      code: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockRequest = {
      params: {},
      query: {},
      body: {},
      userId: "test-user-id",
      headers: {
        authorization: "Bearer test-token",
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getBondById", () => {
    it("should fetch bond by ID successfully", async () => {
      const mockBond = {
        id: 1,
        interestRate: 7.5,
        originalData: {
          TimeToMaturity: "2 years",
          percentageCompletion: 50,
        },
        rating: "AAA",
        badges: ["Popular"],
        logo: "logo.png",
        financeCompanyName: "Test Company",
        description: "Test bond",
      };

      const mockCalculatorData = {
        assetCalcDetails: {
          purchasePrice: 1000,
          preTaxReturns: 1080,
          maxInvestment: 100000,
          maxLots: 100,
          minLots: 1,
        },
      };

      mockRequest.params.bondId = "1";
      controller.bondService.getBondById = jest.fn().mockResolvedValue(mockBond);
      controller.bondService.calculateBond = jest.fn().mockResolvedValue(mockCalculatorData);

      await controller.getBondById(mockRequest, mockReply);

      expect(controller.bondService.getBondById).toHaveBeenCalledWith({
        id: "1",
      });
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should handle errors when bond not found", async () => {
      controller.bondService.getBondById = jest.fn().mockRejectedValue(new Error("Bond not found"));

      mockRequest.params.bondId = "invalid-id";

      await controller.getBondById(mockRequest, mockReply);

      expect(mockReply.log.error).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should include token in response when isRedirection is true", async () => {
      const mockBond = {
        id: 1,
        interestRate: 7.5,
        originalData: {
          TimeToMaturity: "2 years",
          percentageCompletion: 50,
        },
        rating: "AAA",
        badges: ["Popular"],
        logo: "logo.png",
        financeCompanyName: "Test Company",
        description: "Test bond",
      };

      const mockCalculatorData = {
        assetCalcDetails: {
          purchasePrice: 1000,
          preTaxReturns: 1080,
          maxInvestment: 100000,
          maxLots: 100,
          minLots: 1,
        },
      };

      getUserToken.mockResolvedValue("test-token");

      mockRequest.params.bondId = "1";
      mockRequest.query = { isRedirection: "true", userId: "user-123" };
      controller.bondService.getBondById = jest.fn().mockResolvedValue(mockBond);
      controller.bondService.calculateBond = jest.fn().mockResolvedValue(mockCalculatorData);

      await controller.getBondById(mockRequest, mockReply);

      expect(getUserToken).toHaveBeenCalledWith("user-123");
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          token: "test-token",
        })
      );
    });
  });

  describe("calculateBond", () => {
    it("should calculate bond successfully with valid input", async () => {
      const mockResult = {
        assetCalcDetails: {
          purchasePrice: 1000,
          preTaxReturns: 1080,
        },
      };

      controller.bondService.calculateBond = jest.fn().mockResolvedValue(mockResult);
      mockRequest.body = {
        username: "test-user",
        assetId: "123",
        amount: 10000,
      };

      await controller.calculateBond(mockRequest, mockReply);

      expect(controller.bondService.calculateBond).toHaveBeenCalledWith({
        username: "test-user",
        assetId: "123",
        amount: 10000,
      });
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should return error for missing required parameters", async () => {
      mockRequest.body = {
        username: "test-user",
        // Missing assetId
      };

      await controller.calculateBond(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should return error for invalid input", async () => {
      mockRequest.body = null;

      await controller.calculateBond(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should handle errors when calculation fails", async () => {
      controller.bondService.calculateBond = jest.fn().mockRejectedValue(new Error("Calculation failed"));
      mockRequest.body = {
        username: "test-user",
        assetId: "123",
        amount: 10000,
      };

      await controller.calculateBond(mockRequest, mockReply);

      expect(mockReply.log.error).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should use default amount if not provided", async () => {
      const mockResult = {
        assetCalcDetails: {
          purchasePrice: 1000,
        },
      };

      controller.bondService.calculateBond = jest.fn().mockResolvedValue(mockResult);
      mockRequest.body = {
        username: "test-user",
        assetId: "123",
      };

      await controller.calculateBond(mockRequest, mockReply);

      expect(controller.bondService.calculateBond).toHaveBeenCalledWith({
        username: "test-user",
        assetId: "123",
        amount: 10000,
      });
    });
  });

  describe("getBondDetails", () => {
    it("should fetch bond details successfully", async () => {
      const mockBond = {
        _id: "507f1f77bcf86cd799439011",
        name: "Test Bond",
        status: "ACTIVE",
      };

      controller.bondService.getBondDetails = jest.fn().mockResolvedValue(mockBond);
      mockRequest.query.bondId = "507f1f77bcf86cd799439011";

      await controller.getBondDetails(mockRequest, mockReply);

      expect(controller.bondService.getBondDetails).toHaveBeenCalledWith({
        bondId: mockRequest.query.bondId,
      });
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should return error for invalid bond ID", async () => {
      mockRequest.query.bondId = "invalid-id";

      await controller.getBondDetails(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should handle errors when fetching bond details fails", async () => {
      controller.bondService.getBondDetails = jest.fn().mockRejectedValue(new Error("Bond not found"));
      mockRequest.query.bondId = "507f1f77bcf86cd799439011";

      await controller.getBondDetails(mockRequest, mockReply);

      expect(mockReply.log.error).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalled();
    });
  });

  describe("getKYCStatus", () => {
    it("should get KYC status successfully", async () => {
      const mockUserDetails = {
        gripUserName: "test-user",
      };
      const mockKYCStatus = { status: "verified" };

      getFromRedis.mockResolvedValue(mockUserDetails);
      controller.bondService.getKYCStatus = jest.fn().mockResolvedValue(mockKYCStatus);
      mockRequest.userId = "test-user-id";

      await controller.getKYCStatus(mockRequest, mockReply);

      expect(getFromRedis).toHaveBeenCalled();
      expect(controller.bondService.getKYCStatus).toHaveBeenCalledWith({
        username: "test-user",
      });
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should return error when userId is missing", async () => {
      mockRequest.userId = null;

      await controller.getKYCStatus(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should return error when gripUserName is missing", async () => {
      getFromRedis.mockResolvedValue({});
      mockRequest.userId = "test-user-id";

      await controller.getKYCStatus(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalled();
    });
  });

  describe("getKYCUrl", () => {
    it("should generate KYC URL successfully", async () => {
      const mockUserDetails = {
        gripUserName: "test-user",
      };
      const mockKYCUrl = { redirectUrl: "https://kyc.example.com" };

      getFromRedis.mockResolvedValue(mockUserDetails);
      controller.bondService.getKYCUrl = jest.fn().mockResolvedValue(mockKYCUrl);
      mockRequest.query.userId = "test-user-id";

      await controller.getKYCUrl(mockRequest, mockReply);

      expect(controller.bondService.getKYCUrl).toHaveBeenCalledWith({
        username: "test-user",
        userId: "test-user-id",
      });
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should return error when gripUserName is missing", async () => {
      getFromRedis.mockResolvedValue({});
      mockRequest.query.userId = "test-user-id";

      await controller.getKYCUrl(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should handle errors when getting KYC URL fails", async () => {
      const mockUserDetails = {
        gripUserName: "test-user",
      };

      getFromRedis.mockResolvedValue(mockUserDetails);
      controller.bondService.getKYCUrl = jest.fn().mockRejectedValue(new Error("KYC URL generation failed"));
      mockRequest.query.userId = "test-user-id";

      await controller.getKYCUrl(mockRequest, mockReply);

      expect(mockReply.log.error).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalled();
    });
  });

  describe("getCheckoutUrl", () => {
    it("should generate checkout URL successfully", async () => {
      const mockUserDetails = {
        gripUserName: "test-user",
      };
      const mockCheckoutUrl = "https://checkout.example.com";

      getFromRedis.mockResolvedValue(mockUserDetails);
      controller.bondService.getCheckoutUrl = jest.fn().mockResolvedValue(mockCheckoutUrl);
      sendMessage.mockResolvedValue(true);
      mockRequest.query = {
        userId: "test-user-id",
        assetId: "123",
        amount: "1000",
      };
      mockRequest.parentIFAId = "ifa-id";

      await controller.getCheckoutUrl(mockRequest, mockReply);

      expect(controller.bondService.getCheckoutUrl).toHaveBeenCalledWith({
        username: "test-user",
        assetId: "123",
        amount: "1000",
      });
      expect(sendMessage).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should return error for missing required parameters", async () => {
      const mockUserDetails = {
        gripUserName: "test-user",
      };
      getFromRedis.mockResolvedValue(mockUserDetails);
      mockRequest.query = {
        userId: "test-user-id",
        // Missing assetId and amount
      };

      await controller.getCheckoutUrl(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should handle errors when getting checkout URL fails", async () => {
      const mockUserDetails = {
        gripUserName: "test-user",
      };
      getFromRedis.mockResolvedValue(mockUserDetails);
      controller.bondService.getCheckoutUrl = jest.fn().mockRejectedValue(new Error("Checkout URL generation failed"));
      mockRequest.query = {
        userId: "test-user-id",
        assetId: "123",
        amount: "1000",
      };

      await controller.getCheckoutUrl(mockRequest, mockReply);

      expect(mockReply.log.error).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should handle Kafka errors gracefully", async () => {
      const mockUserDetails = {
        gripUserName: "test-user",
      };
      const mockCheckoutUrl = "https://checkout.example.com";

      getFromRedis.mockResolvedValue(mockUserDetails);
      controller.bondService.getCheckoutUrl = jest.fn().mockResolvedValue(mockCheckoutUrl);
      sendMessage.mockRejectedValue(new Error("Kafka error"));
      mockRequest.query = {
        userId: "test-user-id",
        assetId: "123",
        amount: "1000",
      };

      await controller.getCheckoutUrl(mockRequest, mockReply);

      // Should still succeed even if Kafka fails
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalled();
    });
  });

  describe("createGripUser", () => {
    it("should create Grip user successfully", async () => {
      const mockGripId = "grip-user-123";
      const mockUserData = {
        emailID: "test@example.com",
        phoneNumber: "1234567890",
        firstName: "Test",
        lastName: "User",
        countryCode: 91,
      };

      controller.bondService.createGripUser = jest.fn().mockResolvedValue(mockGripId);
      axios.post.mockResolvedValue({ data: { success: true } });
      mockRequest.body = mockUserData;
      mockRequest.userId = "test-user-id";

      await controller.createGripUser(mockRequest, mockReply);

      expect(controller.bondService.createGripUser).toHaveBeenCalledWith(mockUserData);
      expect(axios.post).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should return error for missing required fields", async () => {
      mockRequest.body = {
        emailID: "test@example.com",
        // Missing other required fields
      };

      await controller.createGripUser(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should return error for invalid input", async () => {
      mockRequest.body = null;

      await controller.createGripUser(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should handle errors when creating Grip user fails", async () => {
      controller.bondService.createGripUser = jest.fn().mockRejectedValue(new Error("User creation failed"));
      mockRequest.body = {
        emailID: "test@example.com",
        phoneNumber: "1234567890",
        firstName: "Test",
        lastName: "User",
      };
      mockRequest.userId = "test-user-id";

      await controller.createGripUser(mockRequest, mockReply);

      expect(mockReply.log.error).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should handle errors when updating user grip name fails", async () => {
      const mockGripId = "grip-user-123";
      const mockUserData = {
        emailID: "test@example.com",
        phoneNumber: "1234567890",
        firstName: "Test",
        lastName: "User",
        countryCode: 91,
      };

      controller.bondService.createGripUser = jest.fn().mockResolvedValue(mockGripId);
      axios.post.mockRejectedValue(new Error("API error"));
      mockRequest.body = mockUserData;
      mockRequest.userId = "test-user-id";

      await controller.createGripUser(mockRequest, mockReply);

      expect(mockReply.log.error).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalled();
    });
  });

  describe("getAllBonds", () => {
    it("should fetch all bonds successfully", async () => {
      const mockBonds = {
        data: [
          { id: 1, name: "Bond 1" },
          { id: 2, name: "Bond 2" },
        ],
      };

      controller.bondService.getAllBonds = jest.fn().mockResolvedValue(mockBonds);

      await controller.getAllBonds(mockRequest, mockReply);

      expect(controller.bondService.getAllBonds).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should handle errors when fetching bonds fails", async () => {
      controller.bondService.getAllBonds = jest.fn().mockRejectedValue(new Error("Service error"));

      await controller.getAllBonds(mockRequest, mockReply);

      expect(mockReply.log.error).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalled();
    });
  });

  describe("getAllBondsFromDB", () => {
    it("should fetch bonds from DB with category filter", async () => {
      const mockCategory = {
        bondIds: [
          { _id: "bond1", status: "ACTIVE" },
          { _id: "bond2", status: "ACTIVE" },
        ],
        populate: jest.fn().mockReturnThis(),
      };

      BondCategory.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCategory),
      });
      mockRequest.query = {
        type: "popular",
        limit: "10",
        page: "1",
      };

      await controller.getAllBondsFromDB(mockRequest, mockReply);

      expect(BondCategory.findOne).toHaveBeenCalled();
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should fetch bonds from DB without category filter", async () => {
      const mockData = {
        bonds: [{ id: 1, name: "Bond 1" }],
        totalBonds: 1,
        totalPages: 1,
      };

      controller.bondService.getAllBondsFromDB = jest.fn().mockResolvedValue(mockData);
      BondCategory.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });
      mockRequest.query = {
        limit: "10",
        page: "1",
      };

      await controller.getAllBondsFromDB(mockRequest, mockReply);

      expect(controller.bondService.getAllBondsFromDB).toHaveBeenCalledWith({
        query: {},
        limit: "10",
        page: "1",
        allBonds: undefined,
      });
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should handle errors when fetching bonds fails", async () => {
      controller.bondService.getAllBondsFromDB = jest.fn().mockRejectedValue(new Error("Database error"));
      BondCategory.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });
      mockRequest.query = {
        limit: "10",
        page: "1",
      };

      await controller.getAllBondsFromDB(mockRequest, mockReply);

      expect(mockReply.log.error).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should handle pageNumber parameter", async () => {
      const mockData = {
        bonds: [{ id: 1, name: "Bond 1" }],
        totalBonds: 1,
        totalPages: 1,
      };

      controller.bondService.getAllBondsFromDB = jest.fn().mockResolvedValue(mockData);
      BondCategory.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });
      mockRequest.query = {
        limit: "10",
        pageNumber: "2",
      };

      await controller.getAllBondsFromDB(mockRequest, mockReply);

      expect(controller.bondService.getAllBondsFromDB).toHaveBeenCalledWith({
        query: {},
        limit: "10",
        page: "2",
        allBonds: undefined,
      });
    });
  });
});

