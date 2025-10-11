const fastify = require("fastify")();
const FdController = require("../controllers/fdController");
const FdService = require("../services/fdService");
const request = require("supertest");
const app = require("../app");

jest.mock("../services/fdService");

const mockFd = { id: 1, name: "Test FD" };
const mockFds = [mockFd];

describe("FdController", () => {
  let controller;
  let reply;

  beforeEach(() => {
    controller = new FdController();
    reply = {
      send: jest.fn(),
      log: { error: jest.fn() },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getFDById - valid id", async () => {
    controller.fdService.getFDById = jest.fn().mockResolvedValue(mockFd);
    const request = { params: { id: "1" } };
    await controller.getFDById(request, reply);
    expect(reply.send).toHaveBeenCalledWith({
      status: "success",
      message: "FD fetched",
      data: mockFd,
    });
  });

  test("getFDById - invalid id", async () => {
    const request = { params: { id: "abc" } };
    await controller.getFDById(request, reply);
    expect(reply.send).toHaveBeenCalledWith({
      status: "error",
      message: "Invalid FD id",
    });
  });

  test("getFDById - not found", async () => {
    controller.fdService.getFDById = jest.fn().mockResolvedValue(null);
    const request = { params: { id: "2" } };
    await controller.getFDById(request, reply);
    expect(reply.send).toHaveBeenCalledWith({
      status: "error",
      message: "FD not found",
      statusCode: 404,
    });
  });

  test("getPopularFds - success", async () => {
    controller.fdService.getPopularFds = jest.fn().mockResolvedValue(mockFds);
    const request = {};
    await controller.getPopularFds(request, reply);
    expect(reply.send).toHaveBeenCalledWith({
      status: "success",
      message: "Popular FDs fetched",
      data: mockFds,
    });
  });

  test("getChachaPicks - valid userId", async () => {
    controller.fdService.getChachaPicks = jest.fn().mockResolvedValue(mockFds);
    const request = { user: { id: "user1" }, query: {} };
    await controller.getChachaPicks(request, reply);
    expect(reply.send).toHaveBeenCalledWith({
      status: "success",
      message: "Chacha Picks fetched",
      data: mockFds,
    });
  });

  test("getFdListByType - valid type", async () => {
    controller.fdService.getFdListByType = jest.fn().mockResolvedValue(mockFds);
    const request = { query: { type: "popular", userId: "user1" } };
    await controller.getFdListByType(request, reply);
    expect(reply.send).toHaveBeenCalledWith({
      status: "success",
      message: "FDs for type popular fetched",
      data: mockFds,
    });
  });

  test("getFdListByType - invalid type", async () => {
    const request = { query: { type: 123 } };
    await controller.getFdListByType(request, reply);
    expect(reply.send).toHaveBeenCalledWith({
      status: "error",
      message: "Invalid FD type",
      statusCode: 400,
    });
  });
});

describe("GET /get-fd-details", () => {
  it("should return FD details for valid inputs", async () => {
    const mockFD = { id: "123", payoutType: "MONTHLY", details: "Sample FD" };
    fdService.getFDsByPayoutType.mockResolvedValue(mockFD);

    const response = await request(app)
      .post("/get-fd-details")
      .send({ fdId: "123", payoutType: "MONTHLY" });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(mockFD);
  });

  it("should return 400 for missing inputs", async () => {
    const response = await request(app).post("/get-fd-details").send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("fdId and payoutType are required.");
  });

  it("should return 500 for service errors", async () => {
    fdService.getFDsByPayoutType.mockRejectedValue(new Error("Service error"));

    const response = await request(app)
      .post("/get-fd-details")
      .send({ fdId: "123", payoutType: "MONTHLY" });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe("Service error");
  });
});
