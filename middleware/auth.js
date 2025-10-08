// src/middleware/auth.js
// Fastify authentication middleware. Replace with real logic as needed.
const { verifyToken } = require("../../common_service/src/commonFunctions");
const { sendError } = require("../utils/response");

module.exports = async (request, reply) => {
  return;
  // Skip authentication for Swagger UI and docs endpoints
  if (
    request.raw.url.startsWith("/fd/docs") ||
    request.raw.url.startsWith("/fd/documentation")
  ) {
    return;
  }
  // Allow internal startup tasks to bypass auth
  if (request.headers["x-bank-auth"] === "startup-internal") {
    return;
  }
  const authHeader = request.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError({
      reply,
      message: "Unauthorized: Token required",
      statusCode: 401,
    });
  }
  const token = authHeader.replace("Bearer ", "");
  const user = await verifyToken(token, request.server);
  if (!user) {
    return sendError({
      reply,
      message: "Unauthorized: Invalid token",
      statusCode: 401,
    });
  }
  request.user = user;
};
