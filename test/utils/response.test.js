// This file ensures response utilities are tested
const { sendSuccess, sendError } = require("../../utils/response");

describe("Response Utilities", () => {
  let mockReply;

  beforeEach(() => {
    mockReply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  describe("sendSuccess", () => {
    it("should send success response with default status code", () => {
      sendSuccess({
        reply: mockReply,
        message: "Success",
        data: { test: "data" },
      });

      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        status: "success",
        message: "Success",
        data: { test: "data" },
      });
    });

    it("should send success response with custom status code", () => {
      sendSuccess({
        reply: mockReply,
        message: "Created",
        data: {},
        statusCode: 201,
      });

      expect(mockReply.code).toHaveBeenCalledWith(201);
    });

    it("should include extraData in response", () => {
      sendSuccess({
        reply: mockReply,
        message: "Success",
        data: {},
        extraData: { total: 10 },
      });

      expect(mockReply.send).toHaveBeenCalledWith({
        status: "success",
        message: "Success",
        data: {},
        total: 10,
      });
    });
  });

  describe("sendError", () => {
    it("should send error response with default status code", () => {
      sendError({
        reply: mockReply,
        message: "Error occurred",
      });

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        status: "error",
        message: "Error occurred",
      });
    });

    it("should send error response with custom status code", () => {
      sendError({
        reply: mockReply,
        message: "Not found",
        statusCode: 404,
      });

      expect(mockReply.code).toHaveBeenCalledWith(404);
    });
  });
});

