/**
 * Utility functions for handling audit and admin logs.
 */
const { getFromRedis, saveToRedis } = require("@wc/common-service");
const { REDIS_KEYS } = require("../applicationConstants");
const fastifyLogger = require("fastify").log;

/**
 * Save admin logs in Redis.
 * @param {Object} logData - Log data to save.
 */
async function saveAdminLog(logData) {
  try {
    await saveToRedis({
      key: REDIS_KEYS.ADMIN_LOG,
      value: JSON.stringify(logData),
    });
    fastifyLogger.info({ logData }, "Admin log saved in Redis");
  } catch (err) {
    fastifyLogger.error({ err }, "Error saving admin log in Redis");
  }
}

/**
 * Save authentication logs in Redis.
 * @param {Object} logData - Log data to save.
 */
async function saveAuthLog(logData) {
  try {
    await saveToRedis({
      key: REDIS_KEYS.AUTH_LOG,
      value: JSON.stringify(logData),
    });
    fastifyLogger.info({ logData }, "Auth log saved in Redis");
  } catch (err) {
    fastifyLogger.error({ err }, "Error saving auth log in Redis");
  }
}

module.exports = {
  saveAdminLog,
  saveAuthLog,
};
