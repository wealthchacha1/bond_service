const { createProducer } = require("@wc/common-service");

const brokers = [process.env.KAFKA_BROKER_URL];

const kafkaSetup = async (fastify) => {
  // Silence KafkaJS partitioner warning
  process.env.KAFKAJS_NO_PARTITIONER_WARNING = "1";

  await createProducer({
    clientId: process.env.KAFKA_CLIENT_ID || "bond-service",
    brokers,
  });

  fastify.log.info("Kafka producer initialized for bond service");
};

module.exports = { kafkaSetup };

