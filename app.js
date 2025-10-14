require("dotenv").config();
const path = require("path");
const { connectRedis, verifyToken } = require("@wc/common-service");
const { kafkaSetup } = require("./kafka/kafkaClient");

// require("./services/financeCompanyServiceFactory"); // Removed - file doesn't exist

require("./logger"); // sets global.logger
const fastify = require("fastify")({
  logger: true,
  ajv: {
    customOptions: {
      addUsedSchema: false,
      removeAdditional: true,
      strict: false,
      validateFormats: false, // Disable format validation completely
    },
  },
}); // let Fastify make its own pino

// Make Fastify use the same transport as global logger (optional)
fastify.log = global.logger;
fastify.decorate("logger", fastify.log);

const cors = require("@fastify/cors");
const connectDB = require("./db");
const bondsRoutes = require("./routes/bondRoutes");
const runStartupTasks = require("./startupTasks");

fastify.register(require("@fastify/swagger"), {
  routePrefix: "/bonds",
  swagger: {
    info: {
      title: process.env.SERVICE_TITLE,
      description: process.env.SERVICE_DESCRIPTION,
      version: process.env.SERVICE_VERSION,
    },
    host: process.env.SWAGGER_HOST,
    schemes: ["http", "https"],
    consumes: ["application/json"],
    produces: ["application/json"],
    securityDefinitions: {
      BearerAuth: {
        type: "apiKey",
        name: "Authorization",
        in: "header",
        description: "Enter your JWT token as: Bearer <token>",
      },
    },
    security: [{ BearerAuth: [] }],
  },
  exposeRoute: true,
});

fastify.register(require("@fastify/swagger-ui"), {
  routePrefix: "/bonds/docs",
  staticCSP: true,
  transformStaticCSP: (header) => header,
});

// Register CORS plugin BEFORE routes
fastify.register(require("@fastify/cors"), {
  origin: true, // Allow all origins (customize as needed)
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
});

// Connect to MongoDB
connectDB(fastify);

fastify.decorate("auth", async function (req, reply) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return;
    }

    const token = authHeader.split(" ")[1];
    const user = await verifyToken(token, fastify);
    if (!user) {
      return;
    }

    req.userId = user.userId;
    req.phoneNumber = user.phoneNumber;
    if (user.email) {
      req.email = user.email;
    }
    req.dob = user.dob;
    req.age = user.dob
      ? new Date().getFullYear() - new Date(user.dob).getFullYear()
      : null;
    req.gender = user.gender;
    req.parentIFAId = user.parentIFAId || null;
    req.role = user.role;

    //attach other fields if needed
  } catch (err) {
    fastify.log.error(err, "JWT verification failed in auth preHandler");
    return reply.code(401).send({ error: "Unauthorized" });
  }
});

// Register bond routes with prefix and add auth preHandler to all routes
fastify.register(bondsRoutes, {
  prefix: "/bonds",
  preHandler: fastify.auth, // Require Bearer token for all /bonds APIs
});

// Serve static JS for Swagger UI if needed
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "logos"),
  prefix: "/logos/",
  decorateReply: true, // Only the first static registration should decorate reply
});
fastify.register(require("@fastify/static"), {
  root: require("path").join(__dirname, "../../FE/dist"), // Serve from FE/dist
  prefix: "/",
  decorateReply: false, // Prevents FastifyError: The decorator 'sendFile' has already been added!
});

const start = async () => {
  try {
    // Step 2: Connect to Redis
    await connectRedis(fastify);
    fastify.log.info("Redis connection established successfully");

    // Step 3: Initialize Kafka
    await kafkaSetup(fastify);
    fastify.log.info("Kafka initialized successfully");

    fastify.listen({ port: process.env.PORT || 4000, host: "0.0.0.0" });

    fastify.log.info(
      `${process.env.SERVICE_NAME} running on ${process.env.SERVICE_URL}`
    );
    fastify.log.info(
      `${process.env.SERVICE_NAME} running on ${process.env.SWAGGER_URL}`
    );

    // Run post-startup tasks with logger - fix the parameter passing
    await runStartupTasks(fastify.log);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
