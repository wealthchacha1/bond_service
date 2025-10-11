// src/routes/bondRoutes.js
const BondController = require("../controllers/bondsController");
const BondsCategoryController = require("../controllers/bondsCategoryController");

const {
  getBondByIdSchema,
  calculateBondSchema,
  getAllBondsSchema,
  getBondsByCategorySchema,
  updateBondsInCategorySchema,
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
    { method: "GET", url: "/bonds/docs/*" }
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

  fastify.get(
    "/get-all-bonds",
    { schema: getAllBondsSchema },
    bondController.getAllBondsFromDB
  );

  // User-facing APIs
  fastify.get(
    "/get-bond-by-id/:bondId",
    { schema: getBondByIdSchema },
    bondController.getBondById
  );

  // Bond Category Routes
  fastify.post(
    "/get-bonds-by-category",
    { schema: getBondsByCategorySchema },
    bondsCategoryController.getBondsByCategory
  );

  fastify.post("/create-grip-user", bondController.createGripUser);

  //calculate api
  fastify.post(
    "/calculate-bond",
    { schema: calculateBondSchema },
    bondController.calculateBond
  );

  fastify.get("/get-kyc-url", bondController.getKYCUrl);

  fastify.post(
    "/update-bonds-in-category",
    { schema: updateBondsInCategorySchema },
    bondsCategoryController.updateBondsInCategory
  );
}

module.exports = bondRoutes;
