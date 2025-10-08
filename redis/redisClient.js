// redisClient.js
// Redis client setup for fd service
const { createClient } = require("redis");
require("dotenv").config();

const redisClient = createClient({ url: process.env.REDIS_URL });

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

async function connectRedis(fastify) {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      if (fastify && fastify.log) fastify.log.info("Connected to Redis");
    }
  } catch (err) {
    if (fastify && fastify.log)
      fastify.log.error(err, "Error connecting to Redis:");
    throw err;
  }
}

module.exports = { redisClient, connectRedis };
