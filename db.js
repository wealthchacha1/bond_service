const mongoose = require("mongoose");

async function connectDB(fastify) {
  const uri = process.env.MONGO_URI;
  try {
    await mongoose.connect(uri, { dbName: process.env.MONGO_DB_NAME });
    if (fastify && fastify.log) fastify.log.info("MongoDB connected");
  } catch (err) {
    if (fastify && fastify.log)
      fastify.log.error(err, "MongoDB connection error");
    process.exit(1);
  }
}

module.exports = connectDB;
