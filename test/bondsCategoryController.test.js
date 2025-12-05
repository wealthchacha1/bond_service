const BondsCategoryController = require("../controllers/bondsCategoryController");
const BondsCategoryService = require("../services/bondsCategoryService");

jest.mock("../services/bondsCategoryService");

describe("BondsCategoryController", () => {
  let controller;
  let mockReply;
  let mockRequest;

  beforeEach(() => {
    controller = new BondsCategoryController({
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
      body: {},
      query: {},
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getBondsByCategory", () => {
    it("should fetch bonds by category successfully", async () => {
      const mockResult = {
        bonds: [{ id: 1, name: "Bond 1" }],
        total: 1,
        totalPages: 1,
      };

      controller.bondsCategoryService.getBondsByCategory = jest.fn().mockResolvedValue(mockResult);
      mockRequest.body = {
        categoryName: "popular",
        page: 1,
        limit: 20,
      };

      await controller.getBondsByCategory(mockRequest, mockReply);

      expect(controller.bondsCategoryService.getBondsByCategory).toHaveBeenCalledWith({
        request: mockRequest,
      });
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should handle errors when fetching bonds fails", async () => {
      controller.bondsCategoryService.getBondsByCategory = jest
        .fn()
        .mockRejectedValue(new Error("Service error"));

      await controller.getBondsByCategory(mockRequest, mockReply);

      expect(mockReply.log.error).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalled();
    });
  });

  describe("updateBondsInCategory", () => {
    it("should update bonds in category successfully with addBondIds", async () => {
      const mockResult = {
        category: {
          categoryName: "popular",
          bondIds: ["bond1", "bond2"],
        },
        message: "Bonds in category updated successfully",
      };

      controller.bondsCategoryService.updateBondsInCategory = jest.fn().mockResolvedValue(mockResult);
      mockRequest.body = {
        categoryName: "popular",
        addBondIds: ["bond1", "bond2"],
        removeBondIds: [],
      };

      await controller.updateBondsInCategory(mockRequest, mockReply);

      expect(controller.bondsCategoryService.updateBondsInCategory).toHaveBeenCalledWith({
        categoryName: "popular",
        addBondIds: ["bond1", "bond2"],
        removeBondIds: [],
      });
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should update bonds in category successfully with removeBondIds", async () => {
      const mockResult = {
        category: {
          categoryName: "popular",
          bondIds: ["bond1"],
        },
        message: "Bonds in category updated successfully",
      };

      controller.bondsCategoryService.updateBondsInCategory = jest.fn().mockResolvedValue(mockResult);
      mockRequest.body = {
        categoryName: "popular",
        addBondIds: [],
        removeBondIds: ["bond2"],
      };

      await controller.updateBondsInCategory(mockRequest, mockReply);

      expect(controller.bondsCategoryService.updateBondsInCategory).toHaveBeenCalledWith({
        categoryName: "popular",
        addBondIds: [],
        removeBondIds: ["bond2"],
      });
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should return error when both addBondIds and removeBondIds are empty", async () => {
      mockRequest.body = {
        categoryName: "popular",
        addBondIds: [],
        removeBondIds: [],
      };

      await controller.updateBondsInCategory(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should handle errors when update fails", async () => {
      controller.bondsCategoryService.updateBondsInCategory = jest
        .fn()
        .mockRejectedValue(new Error("Update failed"));

      mockRequest.body = {
        categoryName: "popular",
        addBondIds: ["bond1"],
        removeBondIds: [],
      };

      await controller.updateBondsInCategory(mockRequest, mockReply);

      expect(mockReply.log.error).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalled();
    });
  });

  describe("getFilterOptions", () => {
    it("should fetch filter options successfully", async () => {
      const mockResult = {
        interestRate: { minRate: 5, maxRate: 10 },
        effectiveYield: { minYield: 6, maxYield: 11 },
        financeCompanyNames: ["Company 1", "Company 2"],
        ratings: ["AAA", "AA"],
        tenureMonths: [12, 24, 36],
      };

      controller.bondsCategoryService.getFilterOptions = jest.fn().mockResolvedValue(mockResult);
      mockRequest.query = {
        financeCompanyName: "Company 1",
      };

      await controller.getFilterOptions(mockRequest, mockReply);

      expect(controller.bondsCategoryService.getFilterOptions).toHaveBeenCalledWith({
        financeCompanyName: "Company 1",
      });
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should fetch filter options without financeCompanyName", async () => {
      const mockResult = {
        interestRate: { minRate: 5, maxRate: 10 },
        effectiveYield: { minYield: 6, maxYield: 11 },
        financeCompanyNames: ["Company 1", "Company 2"],
        ratings: ["AAA", "AA"],
        tenureMonths: [12, 24, 36],
      };

      controller.bondsCategoryService.getFilterOptions = jest.fn().mockResolvedValue(mockResult);
      mockRequest.query = {};

      await controller.getFilterOptions(mockRequest, mockReply);

      expect(controller.bondsCategoryService.getFilterOptions).toHaveBeenCalledWith({
        financeCompanyName: undefined,
      });
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("should handle errors when fetching filter options fails", async () => {
      controller.bondsCategoryService.getFilterOptions = jest
        .fn()
        .mockRejectedValue(new Error("Service error"));

      await controller.getFilterOptions(mockRequest, mockReply);

      expect(mockReply.log.error).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalled();
    });
  });
});


