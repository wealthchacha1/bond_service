const FdService = require("../services/fdService");
const { redisClient } = require("../redis/redisClient");
const FD = require("../models/fdSchema");

jest.mock("../models/fdSchema");
jest.mock("../redis/redisClient");

describe("FdService", () => {
  let service;
  beforeEach(() => {
    service = new FdService();
    jest.clearAllMocks();
  });

  it("getPopularFds returns top 3 active FDs sorted by popularityScore/interestRate", async () => {
    FD.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ _id: 1 }, { _id: 2 }, { _id: 3 }]),
    });
    const result = await service.getPopularFds();
    expect(result).toHaveLength(3);
  });

  it("getChachaPicks returns all active FDs if no userId", async () => {
    FD.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([{ _id: 1 }]),
    });
    const result = await service.getChachaPicks();
    expect(result).toEqual([{ _id: 1 }]);
  });

  it("getChachaPicks applies user filters from Redis", async () => {
    redisClient.get.mockResolvedValue(
      JSON.stringify({
        age: 65,
        gender: "F",
        salaryRange: "5-10L",
        preferredTenure: 12,
        payoutType: "MONTHLY",
        wantTaxSaver: true,
        risk: "conservative",
        preferredIssuer: "shriram",
        wantNew: true,
      })
    );
    FD.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([{ _id: 2 }]),
    });
    const result = await service.getChachaPicks("user123");
    expect(FD.find).toHaveBeenCalledWith(
      expect.objectContaining({
        forSenior: true,
        forWomen: true,
        salaryRange: "5-10L",
        tenureMonths: 12,
        payoutType: "MONTHLY",
        isTaxSaver: true,
        safetyRating: { $in: ["AAA", "AA+"] },
        financeCompany: "shriram",
      })
    );
    expect(result).toEqual([{ _id: 2 }]);
  });

  it("getBestByIssuer returns best FD per company", async () => {
    redisClient.get.mockResolvedValue(JSON.stringify(["shriram", "mahindra"]));
    FD.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { financeCompany: "shriram", interestRate: 8 },
        { financeCompany: "shriram", interestRate: 7 },
        { financeCompany: "mahindra", interestRate: 7.5 },
      ]),
    });
    const result = await service.getBestByIssuer();
    expect(result).toEqual([
      { financeCompany: "shriram", interestRate: 8 },
      { financeCompany: "mahindra", interestRate: 7.5 },
    ]);
  });

  it("getFdListByType throws on invalid type", async () => {
    await expect(service.getFdListByType("invalid")).rejects.toThrow(
      "Invalid FD type"
    );
  });

  it("getFDsByPayoutType returns FD details for valid inputs", async () => {
    const mockFD = { id: "123", payoutType: "MONTHLY", details: "Sample FD" };
    FD.findOne.mockResolvedValue(mockFD);

    const result = await service.getFDsByPayoutType({
      fdId: "123",
      payoutType: "MONTHLY",
    });

    expect(result).toEqual(mockFD);
    expect(FD.findOne).toHaveBeenCalledWith({
      _id: "123",
      payoutType: "MONTHLY",
      status: "ACTIVE",
    });
  });

  it("getFDsByPayoutType throws an error if FD is not found", async () => {
    FD.findOne.mockResolvedValue(null);

    await expect(
      service.getFDsByPayoutType({ fdId: "123", payoutType: "MONTHLY" })
    ).rejects.toThrow("FD not found or inactive");
  });

  it("getFDsByPayoutType throws an error for database issues", async () => {
    FD.findOne.mockRejectedValue(new Error("Database error"));

    await expect(
      service.getFDsByPayoutType({ fdId: "123", payoutType: "MONTHLY" })
    ).rejects.toThrow("Database error");
  });
});
