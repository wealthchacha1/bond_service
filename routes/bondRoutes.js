// src/routes/bondRoutes.js
const Bond = require("../models/bondsSchema");
const { getFromRedis } = require("@wc/common-service");
const { REDIS_KEYS } = require("../applicationConstants");
const BondController = require("../controllers/bondsController");
const BondsCategoryController = require("../controllers/bondsCategoryController");

const {
  getPopularBondsSchema,
  getBondListByTypeSchema,
  getBondByIdSchema,
  getIssuerPopularBondListSchema,
  chachaComparesSchema,
  recommendedBondsSchema,
  compareBondsSchema,
  calculateBondSchema,
  getSuggestedBondsSchema,
  getAllGripBondsSchema,
  getBondDetailsSchema,
  getChachaPicksSchema,
  getAllBondsSchema,
  getAllBondsFromDBSchema,
  getBondsByCategorySchema,
  updateBondsInCategorySchema,
  getBondFilterOptionsSchema,
} = require("../validators/validator");

async function bondRoutes(fastify, opts) {
  const bondController = new BondController(fastify.log);
  const bondsCategoryController = new BondsCategoryController(fastify);

  // Add all open (public) routes here
  const openRoutes = [
    { method: "GET", url: "/bonds/health" },
    { method: "GET", url: "/bonds/docs" },
    { method: "GET", url: "/bonds/docs/" },
    { method: "GET", url: "/bonds/openapi.json" },
    { method: "GET", url: "/bonds/docs/static/" },
    { method: "GET", url: "/bonds/docs/static/*" },
    { method: "GET", url: "/bonds/docs/*" },
    {
      method: "POST",
      url: "/bonds/recommended-bonds",
    },
  ];

  fastify.addHook("preHandler", async (req, reply) => {
    const reqMethod = req.method;
    const reqPath = req.routerPath || req.url.split("?")[0];
    const isOpen = openRoutes.some(
      (route) =>
        route.method === reqMethod &&
        (route.url === reqPath ||
          (route.url.endsWith("*") &&
            reqPath.startsWith(route.url.slice(0, -1))))
    );
    if (!isOpen) {
      await fastify.auth(req, reply);
    }
  });

  // User-facing APIs
  // Health check API
  fastify.get("/health", async (request, reply) => {
    reply.send({
      status: "ok",
      uptime: process.uptime(),
      timestamp: Date.now(),
    });
  });

  // User-facing APIs
  fastify.get(
    "/get-bond-by-id/:bondId",
    { schema: getBondByIdSchema },
    bondController.getBondById
  );
  // fastify.get(
  //   "/get-chacha-picks",
  //   { schema: getChachaPicksSchema },
  //   bondController.getChachaPicks
  // );
  fastify.get(
    "/get-bond-list-by-type",
    { schema: getBondListByTypeSchema },
    bondController.getBondListByType
  );
  fastify.get(
    "/get-issuer-popular-bond-list",
    { schema: getIssuerPopularBondListSchema },
    bondController.getIssuerPopularBondList
  );

  fastify.get(
    "/chacha-compares",
    { schema: chachaComparesSchema },
    bondController.getChachaCompares
  );

  fastify.post(
    "/recommended-bonds",
    { schema: recommendedBondsSchema },
    bondController.getRecommendedBonds
  );

  fastify.get(
    "/compare-bonds",
    { schema: compareBondsSchema },
    bondController.compareBonds
  );

  fastify.post(
    "/suggested-bonds",
    { schema: getSuggestedBondsSchema },
    bondController.getSuggestedBonds
  );

  //calculate api
  fastify.post(
    "/calculate-bond",
    { schema: calculateBondSchema },
    bondController.calculateBond
  );

  fastify.get(
    "/get-all-grip-bonds",
    { schema: getAllGripBondsSchema },
    bondController.getAllGripBonds
  );

  fastify.get(
    "/get-bond-details",
    { schema: getBondDetailsSchema },
    bondController.getBondDetails
  );

  fastify.get("/get-kyc-url", bondController.getKYCUrl);

  fastify.post("/create-grip-user", bondController.createGripUser);

  fastify.get(
    "/get-all-bonds",
    { schema: getAllBondsSchema },
    bondController.getAllBondsFromDB
  );

  // Bond Category Routes
  fastify.post(
    "/get-bonds-by-category",
    { schema: getBondsByCategorySchema },
    bondsCategoryController.getBondsByCategory
  );

  fastify.post(
    "/update-bonds-in-category",
    { schema: updateBondsInCategorySchema },
    bondsCategoryController.updateBondsInCategory
  );

  fastify.get(
    "/get-bond-filter-options",
    { schema: getBondFilterOptionsSchema },
    bondsCategoryController.getFilterOptions
  );
}

module.exports = bondRoutes;
