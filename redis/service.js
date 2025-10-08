const { redisClient } = require("./redisClient");

async function saveToRedis({ key, value }) {
  await redisClient.set(key, JSON.stringify(value));
}
async function getFromRedis({ key }) {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
}

async function deleteFromRedis(key) {
  await redisClient.del(key);
}

module.exports = { saveToRedis, getFromRedis, deleteFromRedis };
