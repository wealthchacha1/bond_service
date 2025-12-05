module.exports = {
  connectRedis: jest.fn().mockResolvedValue(true),
  verifyToken: jest.fn().mockResolvedValue({ userId: "test-user-id", role: "investor" }),
  getFromRedis: jest.fn().mockResolvedValue(null),
  saveToRedis: jest.fn().mockResolvedValue(true),
  sendMessage: jest.fn().mockResolvedValue(true),
  getActiveFcList: jest.fn().mockResolvedValue([]),
};


