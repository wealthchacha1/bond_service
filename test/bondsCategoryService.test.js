const BondsCategoryService = require("../services/bondsCategoryService");
const BondCategory = require("../models/bondsCategories");
const Bond = require("../models/bondsSchema");
const { BOND_STATUS } = require("../applicationConstants");

jest.mock("../models/bondsCategories");
jest.mock("../models/bondsSchema");

describe("BondsCategoryService", () => {
  let service;
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };
    service = new BondsCategoryService(mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getBondsByCategory", () => {
    it("should fetch bonds by category with isSelectedBond true", async () => {
      const mockCategory = {
        bondIds: [
          { _id: "bond1", status: "ACTIVE" },
          { _id: "bond2", status: "ACTIVE" },
        ],
      };
      const mockBonds = [
        { _id: "bond1", name: "Bond 1", status: "ACTIVE" },
        { _id: "bond2", name: "Bond 2", status: "ACTIVE" },
      ];

      BondCategory.findOne = jest.fn().mockResolvedValue(mockCategory);
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

      const request = {
        body: {
          categoryName: "popular",
          isSelectedBond: true,
          page: 1,
          limit: 20,
        },
      };

      const result = await service.getBondsByCategory({ request });

      expect(BondCategory.findOne).toHaveBeenCalledWith({
        categoryName: "popular",
      });
      expect(result.bonds).toEqual(mockBonds);
      expect(result.total).toBe(2);
    });

    it("should fetch bonds excluding category when isSelectedBond is false", async () => {
      const mockCategory = {
        bondIds: ["bond1"],
      };
      const mockBonds = [{ _id: "bond2", name: "Bond 2", status: "ACTIVE" }];

      BondCategory.findOne = jest.fn().mockResolvedValue(mockCategory);
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

      const request = {
        body: {
          categoryName: "popular",
          isSelectedBond: false,
          page: 1,
          limit: 20,
        },
      };

      const result = await service.getBondsByCategory({ request });

      expect(result.bonds).toEqual(mockBonds);
    });

    it("should apply interest rate filters", async () => {
      const mockBonds = [{ _id: "bond1", interestRate: 7.5 }];

      BondCategory.findOne = jest.fn().mockResolvedValue(null);
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

      const request = {
        body: {
          categoryName: "popular",
          isSelectedBond: true,
          minInterestRate: 5,
          maxInterestRate: 10,
          page: 1,
          limit: 20,
        },
      };

      await service.getBondsByCategory({ request });

      expect(Bond.find).toHaveBeenCalledWith(
        expect.objectContaining({
          interestRate: {
            $gte: 5,
            $lte: 10,
          },
        })
      );
    });

    it("should apply effective yield filters", async () => {
      const mockBonds = [{ _id: "bond1", effectiveYield: 8.0 }];

      BondCategory.findOne = jest.fn().mockResolvedValue(null);
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

      const request = {
        body: {
          categoryName: "popular",
          isSelectedBond: true,
          minEffectiveYield: 6,
          maxEffectiveYield: 10,
          page: 1,
          limit: 20,
        },
      };

      await service.getBondsByCategory({ request });

      expect(Bond.find).toHaveBeenCalledWith(
        expect.objectContaining({
          effectiveYield: {
            $gte: 6,
            $lte: 10,
          },
        })
      );
    });

    it("should apply finance company name filter", async () => {
      const mockBonds = [{ _id: "bond1", financeCompanyName: "Test Company" }];

      BondCategory.findOne = jest.fn().mockResolvedValue(null);
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

      const request = {
        body: {
          categoryName: "popular",
          isSelectedBond: true,
          financeCompanyName: "Test Company",
          page: 1,
          limit: 20,
        },
      };

      await service.getBondsByCategory({ request });

      expect(Bond.find).toHaveBeenCalledWith(
        expect.objectContaining({
          financeCompanyName: "Test Company",
        })
      );
    });

    it("should apply rating filter", async () => {
      const mockBonds = [{ _id: "bond1", rating: "AAA" }];

      BondCategory.findOne = jest.fn().mockResolvedValue(null);
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

      const request = {
        body: {
          categoryName: "popular",
          isSelectedBond: true,
          rating: "AAA",
          page: 1,
          limit: 20,
        },
      };

      await service.getBondsByCategory({ request });

      expect(Bond.find).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: "AAA",
        })
      );
    });

    it("should apply tenureMonths filter", async () => {
      const mockBonds = [{ _id: "bond1", tenureMonths: 24 }];

      BondCategory.findOne = jest.fn().mockResolvedValue(null);
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

      const request = {
        body: {
          categoryName: "popular",
          isSelectedBond: true,
          tenureMonths: 24,
          page: 1,
          limit: 20,
        },
      };

      await service.getBondsByCategory({ request });

      expect(Bond.find).toHaveBeenCalledWith(
        expect.objectContaining({
          tenureMonths: 24,
        })
      );
    });

    it("should apply sortBy interestRate ascending", async () => {
      const mockBonds = [{ _id: "bond1", interestRate: 7.5 }];

      BondCategory.findOne = jest.fn().mockResolvedValue(null);
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

      const request = {
        body: {
          categoryName: "popular",
          isSelectedBond: true,
          sortBy: "interestRate",
          sortOrder: "asc",
          page: 1,
          limit: 20,
        },
      };

      await service.getBondsByCategory({ request });

      expect(Bond.find().sort).toHaveBeenCalledWith({ interestRate: 1 });
    });

    it("should apply sortBy tenureMonths", async () => {
      const mockBonds = [{ _id: "bond1", tenureMonths: 24 }];

      BondCategory.findOne = jest.fn().mockResolvedValue(null);
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

      const request = {
        body: {
          categoryName: "popular",
          isSelectedBond: true,
          sortBy: "tenureMonths",
          sortOrder: "desc",
          page: 1,
          limit: 20,
        },
      };

      await service.getBondsByCategory({ request });

      expect(Bond.find().sort).toHaveBeenCalledWith({ tenureMonths: -1 });
    });

    it("should handle case when category exists but has no bonds", async () => {
      const mockCategory = {
        bondIds: [],
      };

      BondCategory.findOne = jest.fn().mockResolvedValue(mockCategory);
      Bond.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      Bond.countDocuments = jest.fn().mockResolvedValue(0);

      const request = {
        body: {
          categoryName: "popular",
          isSelectedBond: true,
          page: 1,
          limit: 20,
        },
      };

      const result = await service.getBondsByCategory({ request });

      expect(result.bonds).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should handle errors", async () => {
      BondCategory.findOne = jest.fn().mockRejectedValue(new Error("Database error"));

      const request = {
        body: {
          categoryName: "popular",
          isSelectedBond: true,
          page: 1,
          limit: 20,
        },
      };

      await expect(service.getBondsByCategory({ request })).rejects.toThrow("Database error");
    });
  });

  describe("updateBondsInCategory", () => {
    it("should create new category when it does not exist", async () => {
      const mockCategory = {
        categoryName: "popular",
        bondIds: ["bond1", "bond2"],
        save: jest.fn().mockResolvedValue(true),
      };

      BondCategory.findOne = jest.fn().mockResolvedValue(null);
      BondCategory.mockImplementation(() => mockCategory);

      const result = await service.updateBondsInCategory({
        categoryName: "popular",
        addBondIds: ["bond1", "bond2"],
        removeBondIds: [],
      });

      expect(mockCategory.save).toHaveBeenCalled();
      expect(result.message).toBe("Category created successfully with bonds");
    });

    it("should update existing category with addBondIds", async () => {
      const mockCategory = {
        categoryName: "popular",
        bondIds: ["bond1"],
        save: jest.fn().mockResolvedValue(true),
      };

      BondCategory.findOne = jest.fn().mockResolvedValue(mockCategory);

      const result = await service.updateBondsInCategory({
        categoryName: "popular",
        addBondIds: ["bond2", "bond3"],
        removeBondIds: [],
      });

      expect(mockCategory.bondIds).toEqual(["bond1", "bond2", "bond3"]);
      expect(mockCategory.save).toHaveBeenCalled();
      expect(result.message).toBe("Bonds in category updated successfully");
    });

    it("should handle both add and remove operations", async () => {
      const mockCategory = {
        categoryName: "popular",
        bondIds: ["bond1", "bond2"],
        save: jest.fn().mockResolvedValue(true),
      };

      BondCategory.findOne = jest.fn().mockResolvedValue(mockCategory);

      const result = await service.updateBondsInCategory({
        categoryName: "popular",
        addBondIds: ["bond3", "bond4"],
        removeBondIds: ["bond2"],
      });

      expect(mockCategory.bondIds).toContain("bond1");
      expect(mockCategory.bondIds).toContain("bond3");
      expect(mockCategory.bondIds).toContain("bond4");
      expect(mockCategory.bondIds).not.toContain("bond2");
      expect(mockCategory.save).toHaveBeenCalled();
    });

    it("should handle duplicate bondIds when adding", async () => {
      const mockCategory = {
        categoryName: "popular",
        bondIds: ["bond1"],
        save: jest.fn().mockResolvedValue(true),
      };

      BondCategory.findOne = jest.fn().mockResolvedValue(mockCategory);

      await service.updateBondsInCategory({
        categoryName: "popular",
        addBondIds: ["bond1", "bond2", "bond2"], // bond1 already exists, bond2 duplicated
        removeBondIds: [],
      });

      // Should not have duplicates
      const uniqueBonds = [...new Set(mockCategory.bondIds)];
      expect(mockCategory.bondIds.length).toBe(uniqueBonds.length);
    });

    it("should update existing category with removeBondIds", async () => {
      const mockCategory = {
        categoryName: "popular",
        bondIds: ["bond1", "bond2", "bond3"],
        save: jest.fn().mockResolvedValue(true),
      };

      BondCategory.findOne = jest.fn().mockResolvedValue(mockCategory);

      const result = await service.updateBondsInCategory({
        categoryName: "popular",
        addBondIds: [],
        removeBondIds: ["bond2"],
      });

      expect(mockCategory.bondIds).toEqual(["bond1", "bond3"]);
      expect(mockCategory.save).toHaveBeenCalled();
    });

    it("should throw error when categoryName is missing", async () => {
      await expect(
        service.updateBondsInCategory({
          addBondIds: ["bond1"],
          removeBondIds: [],
        })
      ).rejects.toThrow("Category name is required");
    });

    it("should throw error when both addBondIds and removeBondIds are empty", async () => {
      await expect(
        service.updateBondsInCategory({
          categoryName: "popular",
          addBondIds: [],
          removeBondIds: [],
        })
      ).rejects.toThrow("At least one of addBondIds or removeBondIds must be provided");
    });
  });

  describe("getFilterOptions", () => {
    it("should fetch filter options successfully", async () => {
      const mockInterestRateRange = [
        { minInterestRate: 5, maxInterestRate: 10 },
      ];
      const mockEffectiveYieldRange = [
        { minEffectiveYield: 6, maxEffectiveYield: 11 },
      ];
      const mockFinanceCompanyNames = ["Company 1", "Company 2"];
      const mockRatings = ["AAA", "AA"];
      const mockTenureMonths = [12, 24, 36];

      Bond.aggregate = jest
        .fn()
        .mockResolvedValueOnce(mockInterestRateRange)
        .mockResolvedValueOnce(mockEffectiveYieldRange);
      Bond.distinct = jest
        .fn()
        .mockResolvedValueOnce(mockFinanceCompanyNames)
        .mockResolvedValueOnce(mockRatings)
        .mockResolvedValueOnce(mockTenureMonths);

      const result = await service.getFilterOptions({});

      expect(result.interestRate).toEqual(mockInterestRateRange[0]);
      expect(result.effectiveYield).toEqual(mockEffectiveYieldRange[0]);
      expect(result.financeCompanyNames).toEqual(mockFinanceCompanyNames);
      expect(result.ratings).toEqual(mockRatings);
      expect(result.tenureMonths).toEqual([12, 24, 36]);
    });

    it("should fetch filter options with financeCompanyName filter", async () => {
      const mockRatings = ["AAA"];

      Bond.aggregate = jest
        .fn()
        .mockResolvedValueOnce([{ minInterestRate: 5, maxInterestRate: 10 }])
        .mockResolvedValueOnce([{ minEffectiveYield: 6, maxEffectiveYield: 11 }]);
      Bond.distinct = jest
        .fn()
        .mockResolvedValueOnce(["Company 1"])
        .mockResolvedValueOnce(mockRatings)
        .mockResolvedValueOnce([12, 24]);

      const result = await service.getFilterOptions({
        financeCompanyName: "Company 1",
      });

      expect(Bond.distinct).toHaveBeenCalledWith(
        "rating",
        expect.objectContaining({
          financeCompanyName: "Company 1",
        })
      );
      expect(result.ratings).toEqual(mockRatings);
    });

    it("should return default values when no data found", async () => {
      Bond.aggregate = jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      Bond.distinct = jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getFilterOptions({});

      expect(result.interestRate).toEqual({ minRate: 0, maxRate: 15 });
      expect(result.effectiveYield).toEqual({ minYield: 0, maxYield: 15 });
      expect(result.financeCompanyNames).toEqual([]);
      expect(result.ratings).toEqual([]);
      expect(result.tenureMonths).toEqual([]);
    });

    it("should filter out null/undefined values from distinct results", async () => {
      Bond.aggregate = jest
        .fn()
        .mockResolvedValueOnce([{ minInterestRate: 5, maxInterestRate: 10 }])
        .mockResolvedValueOnce([{ minEffectiveYield: 6, maxEffectiveYield: 11 }]);
      Bond.distinct = jest
        .fn()
        .mockResolvedValueOnce(["Company 1", null, "Company 2", undefined])
        .mockResolvedValueOnce(["AAA", null, "AA"])
        .mockResolvedValueOnce([12, null, 24, undefined]);

      const result = await service.getFilterOptions({});

      expect(result.financeCompanyNames).toEqual(["Company 1", "Company 2"]);
      expect(result.ratings).toEqual(["AAA", "AA"]);
      expect(result.tenureMonths).toEqual([12, 24]);
    });

    it("should handle errors", async () => {
      Bond.aggregate = jest.fn().mockRejectedValue(new Error("Database error"));

      await expect(service.getFilterOptions({})).rejects.toThrow("Database error");
    });
  });
});

