const BondService = require("../services/bondService");
const Bond = require("../models/bondsSchema");
const { GripFinanceService } = require("@fc/grip_bond_service");
const { BOND_STATUS } = require("../applicationConstants");
const { saveAdminLog, saveAuthLog } = require("../utils/auditLogs");

jest.mock("../models/bondsSchema");
jest.mock("@fc/grip_bond_service");
jest.mock("../utils/auditLogs");

describe("BondService", () => {
  let bondService;
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };
    bondService = new BondService(mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllBondsFromDB", () => {
    it("should fetch bonds from DB with default parameters", async () => {
      const mockBonds = [
        { id: 1, name: "Bond 1", status: "ACTIVE" },
        { id: 2, name: "Bond 2", status: "ACTIVE" },
      ];

      Bond.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockBonds),
            }),
          }),
        }),
      });
      Bond.countDocuments = jest.fn().mockResolvedValue(2);

      const result = await bondService.getAllBondsFromDB({});

      expect(result.bonds).toEqual(mockBonds);
      expect(result.totalBonds).toBe(2);
      expect(result.totalPages).toBe(1);
    });

    it("should fetch bonds with custom query and pagination", async () => {
      const mockBonds = [{ id: 1, name: "Bond 1" }];
      const query = { financeCompanyName: "Test Company" };

      Bond.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockBonds),
            }),
          }),
        }),
      });
      Bond.countDocuments = jest.fn().mockResolvedValue(1);

      const result = await bondService.getAllBondsFromDB({
        query,
        limit: 10,
        page: 1,
      });

      expect(Bond.find).toHaveBeenCalledWith(
        expect.objectContaining({ ...query, status: BOND_STATUS.ACTIVE })
      );
      expect(result.bonds).toEqual(mockBonds);
    });

    it("should fetch all bonds when allBonds is true", async () => {
      const mockBonds = [{ id: 1, name: "Bond 1", status: "INACTIVE" }];

      Bond.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockBonds),
            }),
          }),
        }),
      });
      Bond.countDocuments = jest.fn().mockResolvedValue(1);

      const result = await bondService.getAllBondsFromDB({
        allBonds: true,
      });

      expect(Bond.find).toHaveBeenCalledWith({});
      expect(result.bonds).toEqual(mockBonds);
    });
  });

  describe("getAllBonds", () => {
    it("should fetch all bonds from Grip service", async () => {
      const mockBonds = {
        data: [
          { id: 1, name: "Bond 1" },
          { id: 2, name: "Bond 2" },
        ],
      };

      bondService.gripService.getAllBonds = jest.fn().mockResolvedValue(mockBonds);

      const result = await bondService.getAllBonds();

      expect(bondService.gripService.getAllBonds).toHaveBeenCalledWith(
        "68cc07d2b56f2c5b52a0d1b0"
      );
      expect(result).toEqual(mockBonds);
    });
  });

  describe("getAllGripBonds", () => {
    it("should fetch all bonds from Grip service successfully", async () => {
      const mockBonds = {
        data: [
          { id: 1, name: "Bond 1" },
          { id: 2, name: "Bond 2" },
        ],
      };

      bondService.gripService.getAllBonds = jest.fn().mockResolvedValue(mockBonds);

      const result = await bondService.getAllGripBonds();

      expect(bondService.gripService.getAllBonds).toHaveBeenCalledWith(
        "68cc07d2b56f2c5b52a0d1b0"
      );
      expect(result).toEqual(mockBonds);
      expect(mockLogger.info).toHaveBeenCalledWith("Fetching all bonds from Grip service");
      expect(mockLogger.info).toHaveBeenCalledWith("All bonds fetched successfully");
    });

    it("should handle errors when fetching all bonds fails", async () => {
      const error = new Error("Failed to fetch bonds");
      bondService.gripService.getAllBonds = jest.fn().mockRejectedValue(error);

      await expect(bondService.getAllGripBonds()).rejects.toThrow("Failed to fetch bonds");
      expect(mockLogger.error).toHaveBeenCalledWith(
        { error },
        "Error fetching all bonds"
      );
    });
  });

  describe("getBondById", () => {
    it("should fetch bond by ID successfully", async () => {
      const mockBond = {
        id: 1,
        name: "Test Bond",
        status: "ACTIVE",
      };

      Bond.findOne = jest.fn().mockResolvedValue(mockBond);

      const result = await bondService.getBondById({ id: 1 });

      expect(Bond.findOne).toHaveBeenCalledWith({
        id: 1,
        status: BOND_STATUS.ACTIVE,
      });
      expect(result).toEqual(mockBond);
    });

    it("should throw error when bond not found", async () => {
      Bond.findOne = jest.fn().mockResolvedValue(null);

      await expect(bondService.getBondById({ id: 999 })).rejects.toThrow(
        "Bond not found or inactive"
      );
    });
  });

  describe("calculateBond", () => {
    it("should calculate bond returns successfully", async () => {
      const mockResult = {
        assetCalcDetails: {
          purchasePrice: 1000,
          preTaxReturns: 1080,
        },
      };

      bondService.gripService.calculateBonds = jest.fn().mockResolvedValue(mockResult);

      const result = await bondService.calculateBond({
        username: "test-user",
        assetId: "123",
        amount: 10000,
      });

      expect(bondService.gripService.calculateBonds).toHaveBeenCalledWith("test-user", "123");
      expect(result).toEqual(mockResult);
    });

    it("should use default amount if not provided", async () => {
      const mockResult = { assetCalcDetails: {} };

      bondService.gripService.calculateBonds = jest.fn().mockResolvedValue(mockResult);

      await bondService.calculateBond({
        username: "test-user",
        assetId: "123",
      });

      expect(bondService.gripService.calculateBonds).toHaveBeenCalled();
    });

    it("should handle errors when calculation fails", async () => {
      bondService.gripService.calculateBonds = jest.fn().mockRejectedValue(new Error("Calculation failed"));

      await expect(
        bondService.calculateBond({
          username: "test-user",
          assetId: "123",
        })
      ).rejects.toThrow("Calculation failed");
    });
  });

  describe("getBondDetails", () => {
    it("should fetch bond details successfully", async () => {
      const mockBond = {
        _id: "507f1f77bcf86cd799439011",
        name: "Test Bond",
        status: "ACTIVE",
      };

      Bond.findOne = jest.fn().mockResolvedValue(mockBond);

      const result = await bondService.getBondDetails({
        bondId: "507f1f77bcf86cd799439011",
      });

      expect(Bond.findOne).toHaveBeenCalledWith({
        _id: "507f1f77bcf86cd799439011",
        status: BOND_STATUS.ACTIVE,
      });
      expect(result).toEqual(mockBond);
    });

    it("should throw error when bond not found", async () => {
      Bond.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        bondService.getBondDetails({
          bondId: "507f1f77bcf86cd799439011",
        })
      ).rejects.toThrow("Bond not found or inactive");
    });
  });

  describe("getKYCStatus", () => {
    it("should get KYC status successfully", async () => {
      const mockStatus = { status: "verified" };

      bondService.gripService.getKYCStatus = jest.fn().mockResolvedValue(mockStatus);

      const result = await bondService.getKYCStatus({ username: "test-user" });

      expect(bondService.gripService.getKYCStatus).toHaveBeenCalledWith("test-user");
      expect(result).toEqual(mockStatus);
    });

    it("should handle errors when getting KYC status fails", async () => {
      bondService.gripService.getKYCStatus = jest.fn().mockRejectedValue(new Error("KYC check failed"));

      await expect(bondService.getKYCStatus({ username: "test-user" })).rejects.toThrow(
        "KYC check failed"
      );
    });
  });

  describe("getKYCUrl", () => {
    it("should get KYC URL successfully", async () => {
      const mockUrl = { redirectUrl: "https://kyc.example.com" };

      bondService.gripService.getRedirectionUrlForKYC = jest.fn().mockResolvedValue(mockUrl);

      const result = await bondService.getKYCUrl({
        username: "test-user",
        userId: "user-id",
      });

      expect(bondService.gripService.getRedirectionUrlForKYC).toHaveBeenCalledWith(
        "test-user",
        "user-id"
      );
      expect(result).toEqual(mockUrl);
      expect(mockLogger.info).toHaveBeenCalledWith({ username: "test-user" }, "Getting KYC URL");
      expect(mockLogger.info).toHaveBeenCalledWith({ result: mockUrl }, "KYC URL generated");
    });

    it("should handle errors when getting KYC URL fails", async () => {
      const error = new Error("KYC URL generation failed");
      bondService.gripService.getRedirectionUrlForKYC = jest.fn().mockRejectedValue(error);

      await expect(
        bondService.getKYCUrl({
          username: "test-user",
          userId: "user-id",
        })
      ).rejects.toThrow("KYC URL generation failed");

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error, username: "test-user", userId: "user-id" },
        "Error getting KYC URL"
      );
    });
  });

  describe("getCheckoutUrl", () => {
    it("should get checkout URL successfully", async () => {
      const mockUrl = "https://checkout.example.com";

      bondService.gripService.getCheckoutRedirectUrl = jest.fn().mockResolvedValue(mockUrl);

      const result = await bondService.getCheckoutUrl({
        username: "test-user",
        assetId: "123",
        amount: "1000",
      });

      expect(bondService.gripService.getCheckoutRedirectUrl).toHaveBeenCalledWith(
        "test-user",
        "123",
        "1000"
      );
      expect(result).toEqual(mockUrl);
      expect(mockLogger.info).toHaveBeenCalledWith({ result: mockUrl }, "Checkout URL generated");
    });

    it("should handle errors when getting checkout URL fails", async () => {
      const error = new Error("Checkout URL generation failed");
      bondService.gripService.getCheckoutRedirectUrl = jest.fn().mockRejectedValue(error);

      await expect(
        bondService.getCheckoutUrl({
          username: "test-user",
          assetId: "123",
          amount: "1000",
        })
      ).rejects.toThrow("Checkout URL generation failed");

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error, username: "test-user", assetId: "123", amount: "1000" },
        "Error getting checkout URL"
      );
    });
  });

  describe("createGripUser", () => {
    it("should create Grip user successfully", async () => {
      const mockUsername = "testuser1234";
      const userData = {
        emailID: "test@example.com",
        phoneNumber: "1234567890",
        firstName: "Test",
        lastName: "User",
        countryCode: 91,
      };

      bondService.gripService.createGripUser = jest.fn().mockResolvedValue(mockUsername);

      const result = await bondService.createGripUser(userData);

      expect(bondService.gripService.createGripUser).toHaveBeenCalledWith(
        userData,
        "test7890"
      );
      expect(result).toEqual(mockUsername);
    });

    it("should use default countryCode if not provided", async () => {
      const userData = {
        emailID: "test@example.com",
        phoneNumber: "1234567890",
        firstName: "Test",
        lastName: "User",
      };

      bondService.gripService.createGripUser = jest.fn().mockResolvedValue("username");

      await bondService.createGripUser(userData);

      expect(bondService.gripService.createGripUser).toHaveBeenCalledWith(
        { ...userData, countryCode: 91 },
        expect.any(String)
      );
    });

    it("should generate username correctly from firstName and phoneNumber", async () => {
      const userData = {
        emailID: "test@example.com",
        phoneNumber: "1234567890",
        firstName: "John",
        lastName: "Doe",
        countryCode: 91,
      };

      bondService.gripService.createGripUser = jest.fn().mockResolvedValue("john7890");

      await bondService.createGripUser(userData);

      expect(bondService.gripService.createGripUser).toHaveBeenCalledWith(
        userData,
        "john7890"
      );
    });

    it("should handle errors when creating Grip user fails", async () => {
      const error = new Error("User creation failed");
      const userData = {
        emailID: "test@example.com",
        phoneNumber: "1234567890",
        firstName: "Test",
        lastName: "User",
        countryCode: 91,
      };

      bondService.gripService.createGripUser = jest.fn().mockRejectedValue(error);

      await expect(bondService.createGripUser(userData)).rejects.toThrow("User creation failed");

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error, emailID: "test@example.com", phoneNumber: "1234567890" },
        "Error creating Grip user"
      );
    });
  });

  describe("saveAdminLog", () => {
    it("should save admin log", async () => {
      const logData = { action: "test", userId: "user123" };

      await bondService.saveAdminLog(logData);

      expect(saveAdminLog).toHaveBeenCalledWith(logData);
    });
  });

  describe("saveAuthLog", () => {
    it("should save auth log", async () => {
      const logData = { action: "login", userId: "user123" };

      await bondService.saveAuthLog(logData);

      expect(saveAuthLog).toHaveBeenCalledWith(logData);
    });
  });
});


