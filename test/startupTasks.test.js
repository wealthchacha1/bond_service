const runStartupTasks = require("../startupTasks");
const BondService = require("../services/bondService");
const Bond = require("../models/bondsSchema");
const cron = require("node-cron");

jest.mock("../services/bondService");
jest.mock("../models/bondsSchema");
jest.mock("node-cron");

describe("startupTasks", () => {
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("runGripBondInitialFetch", () => {
    it("should fetch and store bonds successfully", async () => {
      const mockBondsData = [
        {
          id: 1,
          name: "Bond 1",
          interestRate: 7.5,
          financeCompanyName: "Test Company",
        },
        {
          id: 2,
          name: "Bond 2",
          interestRate: 8.0,
          financeCompanyName: "Test Company",
        },
      ];

      const mockBondsResponse = {
        data: mockBondsData,
      };

      BondService.prototype.getAllBonds = jest.fn().mockResolvedValue(mockBondsResponse);
      Bond.findOne = jest.fn().mockResolvedValue(null);
      Bond.create = jest.fn().mockResolvedValue({});
      Bond.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 0 });

      const result = await runStartupTasks(mockLogger);

      expect(BondService.prototype.getAllBonds).toHaveBeenCalled();
      expect(Bond.create).toHaveBeenCalledTimes(2);
      expect(result.stored).toBe(2);
      expect(result.updated).toBe(0);
    });

    it("should update existing bonds", async () => {
      const mockBondsData = [
        {
          id: 1,
          name: "Bond 1 Updated",
          interestRate: 7.5,
          financeCompanyName: "Test Company",
        },
      ];

      const mockBondsResponse = {
        data: mockBondsData,
      };

      const existingBond = {
        id: 1,
        name: "Bond 1",
      };

      BondService.prototype.getAllBonds = jest.fn().mockResolvedValue(mockBondsResponse);
      Bond.findOne = jest.fn().mockResolvedValue(existingBond);
      Bond.findOneAndUpdate = jest.fn().mockResolvedValue({});
      Bond.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 0 });

      const result = await runStartupTasks(mockLogger);

      expect(Bond.findOneAndUpdate).toHaveBeenCalled();
      expect(result.updated).toBe(1);
      expect(result.stored).toBe(0);
    });

    it("should mark bonds as INACTIVE if not in API response", async () => {
      const mockBondsData = [
        {
          id: 1,
          name: "Bond 1",
          interestRate: 7.5,
          financeCompanyName: "Test Company",
        },
      ];

      const mockBondsResponse = {
        data: mockBondsData,
      };

      BondService.prototype.getAllBonds = jest.fn().mockResolvedValue(mockBondsResponse);
      Bond.findOne = jest.fn().mockResolvedValue(null);
      Bond.create = jest.fn().mockResolvedValue({});
      Bond.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 2 });

      const result = await runStartupTasks(mockLogger);

      expect(Bond.updateMany).toHaveBeenCalledWith(
        {
          id: { $nin: [1] },
          status: "ACTIVE",
        },
        {
          status: "INACTIVE",
          updatedAt: expect.any(Date),
        }
      );
      expect(result.inactivated).toBe(2);
    });

    it("should handle empty bonds data", async () => {
      const mockBondsResponse = {
        data: [],
      };

      BondService.prototype.getAllBonds = jest.fn().mockResolvedValue(mockBondsResponse);

      const result = await runStartupTasks(mockLogger);

      expect(mockLogger.warn).toHaveBeenCalledWith("No bonds data received from API");
      expect(result.message).toBe("No bonds to store");
    });

    it("should handle errors when storing bonds", async () => {
      const mockBondsData = [
        {
          id: 1,
          name: "Bond 1",
          interestRate: 7.5,
          financeCompanyName: "Test Company",
        },
      ];

      const mockBondsResponse = {
        data: mockBondsData,
      };

      BondService.prototype.getAllBonds = jest.fn().mockResolvedValue(mockBondsResponse);
      Bond.findOne = jest.fn().mockRejectedValue(new Error("Database error"));
      Bond.create = jest.fn().mockResolvedValue({});
      Bond.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 0 });

      // Function catches errors and doesn't throw, just logs them
      const result = await runStartupTasks(mockLogger);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(result.errors).toBeGreaterThan(0);
    });

    it("should schedule cron job for daily execution", async () => {
      const mockBondsResponse = {
        data: [],
      };

      BondService.prototype.getAllBonds = jest.fn().mockResolvedValue(mockBondsResponse);
      cron.schedule = jest.fn();

      await runStartupTasks(mockLogger);

      expect(cron.schedule).toHaveBeenCalledWith(
        "30 1 * * *",
        expect.any(Function),
        {
          scheduled: true,
          timezone: "Asia/Kolkata",
        }
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Grip Bond initial fetch cron scheduled for daily at 1:30 AM"
      );
    });

    it("should handle errors in scheduled cron job", async () => {
      const mockBondsResponse = {
        data: [],
      };

      BondService.prototype.getAllBonds = jest.fn().mockResolvedValue(mockBondsResponse);
      cron.schedule = jest.fn((schedule, callback) => {
        // Simulate cron execution
        callback();
      });

      await runStartupTasks(mockLogger);

      // Get the cron callback and execute it with error
      const cronCallback = cron.schedule.mock.calls[0][1];
      BondService.prototype.getAllBonds = jest.fn().mockRejectedValue(new Error("Cron error"));
      
      await cronCallback();

      // Verify error was logged
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should handle errors when marking bonds as inactive fails", async () => {
      const mockBondsData = [
        {
          id: 1,
          name: "Bond 1",
          interestRate: 7.5,
          financeCompanyName: "Test Company",
        },
      ];

      const mockBondsResponse = {
        data: mockBondsData,
      };

      BondService.prototype.getAllBonds = jest.fn().mockResolvedValue(mockBondsResponse);
      Bond.findOne = jest.fn().mockResolvedValue(null);
      Bond.create = jest.fn().mockResolvedValue({});
      Bond.updateMany = jest.fn().mockRejectedValue(new Error("Update failed"));

      const result = await runStartupTasks(mockLogger);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(result.stored).toBe(1);
    });

    it("should handle individual bond storage errors gracefully", async () => {
      const mockBondsData = [
        {
          id: 1,
          name: "Bond 1",
          interestRate: 7.5,
          financeCompanyName: "Test Company",
        },
        {
          id: 2,
          name: "Bond 2",
          interestRate: 8.0,
          financeCompanyName: "Test Company",
        },
      ];

      const mockBondsResponse = {
        data: mockBondsData,
      };

      BondService.prototype.getAllBonds = jest.fn().mockResolvedValue(mockBondsResponse);
      Bond.findOne = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockRejectedValueOnce(new Error("Storage error"));
      Bond.create = jest.fn().mockResolvedValue({});
      Bond.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 0 });

      const result = await runStartupTasks(mockLogger);

      expect(result.errors).toBe(1);
      expect(result.stored).toBe(1);
    });
  });
});

