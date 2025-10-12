// validators/validator.js

// Bond-specific schemas
const bondResponse = {
  status: { type: "string" },
  message: { type: "string" },
  data: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      statusCode: { type: "number" },
      message: { type: "string" },
      data: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "number" },
            name: { type: "string" },
            schemeName: { type: "string" },
            description: { type: "string" },
            interestRate: { type: "number" },
            effectiveYield: { type: "number" },
            minAmount: { type: "number" },
            maxAmount: { type: "number" },
            tenureMonths: { type: "number" },
            tenureDays: { type: "number" },
            financeCompanyName: { type: "string" },
            logo: { type: "string" },
            rating: { type: "string" },
            category: { type: "string" },
            productCategory: { type: "string" },
            productSubCategory: { type: "string" },
            financeProductType: { type: "string" },
            minLots: { type: "number" },
            maxLots: { type: "number" },
            investmentAmount: { type: "number" },
            badges: {
              type: "array",
              items: { type: "string" },
            },
            isin: { type: "string" },
            returnsType: { type: "string" },
            status: { type: "string" },
            subtitle: { type: "string" },
            originalData: {
              type: "object",
              properties: {
                assetID: { type: "number" },
                header: { type: "string" },
                logo: { type: "string" },
                partnerName: { type: "string" },
                description: { type: "string" },
                financeProductType: { type: "string" },
                assetName: { type: "string" },
                minInvestment: { type: "number" },
                badges: {
                  type: "array",
                  items: { type: "string" },
                },
                category: { type: "string" },
                returnsType: { type: "string" },
                isin: { type: "string" },
                tenure: { type: "string" },
                preTaxYield: { type: "number" },
                TimeToMaturity: { type: "number" },
                compliantBody: { type: "string" },
                rating: { type: "string" },
                percentageCompletion: { type: "number" },
              },
            },
          },
        },
      },
    },
  },
  totalBonds: { type: "number" },
  totalPages: { type: "number" },
};

const getBondByIdSchema = {
  params: {
    type: "object",
    properties: {
      bondId: { type: "number" },
    },
    required: ["bondId"],
  },
  response: {
    200: bondResponse,
  },
};

const getAllBondsSchema = {
  querystring: {
    type: "object",
    properties: {
      limit: { type: "number", default: 4, minimum: 1 },
      page: { type: "number", default: 1, minimum: 1 },
      type: {
        type: "string",
      },
    },
  },
  response: {
    200: bondResponse,
  },
};

// Bond Category Schemas
const getBondsByCategorySchema = {
  body: {
    type: "object",
    properties: {
      categoryName: {
        type: "string",
      },
      minInterestRate: {
        type: "number",
        minimum: 0,
        maximum: 50,
      },
      maxInterestRate: {
        type: "number",
        minimum: 0,
        maximum: 50,
      },
      minEffectiveYield: {
        type: "number",
        minimum: 0,
        maximum: 50,
      },
      maxEffectiveYield: {
        type: "number",
        minimum: 0,
        maximum: 50,
      },
      financeCompanyName: {
        type: "string",
      },
      rating: {
        type: "string",
      },
      tenureMonths: {
        type: "number",
        minimum: 1,
      },
      isSelectedBond: {
        type: "boolean",
        default: true,
      },
      sortBy: {
        type: "string",
        enum: ["interestRate", "effectiveYield", "tenureMonths"],
        default: "effectiveYield",
      },
      sortOrder: {
        type: "string",
        enum: ["asc", "desc"],
        default: "desc",
      },
      limit: {
        type: "number",
        minimum: 1,
        maximum: 100,
        default: 20,
      },
      page: {
        type: "number",
        minimum: 1,
        default: 1,
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            bonds: {
              type: "array",
              items: { type: "object", additionalProperties: true },
            },
            total: { type: "number" },
            totalPages: { type: "number" },
            appliedFilters: {
              type: "object",
              properties: {
                categoryName: { type: "string" },
                minInterestRate: { type: "number" },
                maxInterestRate: { type: "number" },
                minEffectiveYield: { type: "number" },
                maxEffectiveYield: { type: "number" },
                sortBy: { type: "string" },
                sortOrder: { type: "string" },
                financeCompanyName: { type: "string" },
                rating: { type: "string" },
                tenureMonths: { type: "number" },
                isSelectedBond: { type: "boolean" },
              },
              additionalProperties: false,
            },
          },
          required: ["bonds", "total", "totalPages", "appliedFilters"],
        },
      },
    },
    400: {
      type: "object",
      properties: {
        status: { type: "string" },
        message: { type: "string" },
      },
    },
    404: {
      type: "object",
      properties: {
        status: { type: "string" },
        message: { type: "string" },
      },
    },
    500: {
      type: "object",
      properties: {
        status: { type: "string" },
        message: { type: "string" },
      },
    },
  },
};

const updateBondsInCategorySchema = {
  body: {
    type: "object",
    properties: {
      categoryName: {
        type: "string",
      },
      addBondIds: {
        type: "array",
        items: { type: "string" },
        default: [],
      },
      removeBondIds: {
        type: "array",
        items: { type: "string" },
        default: [],
      },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string" },
        message: { type: "string" },
        data: { type: "object" },
      },
    },
    400: {
      type: "object",
      properties: { status: { type: "string" }, message: { type: "string" } },
    },
    404: {
      type: "object",
      properties: { status: { type: "string" }, message: { type: "string" } },
    },
    500: {
      type: "object",
      properties: { status: { type: "string" }, message: { type: "string" } },
    },
  },
};

const createGripUserSchema = {
  body: {
    type: "object",
    properties: {
      emailID: { type: "string" },
      phoneNumber: { type: "number" },
      firstName: { type: "string" },
      lastName: { type: "string" },
    },
    required: ["emailID", "phoneNumber", "firstName", "lastName"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string" },
        message: { type: "string" },
        data: { type: "object" },
      },
    },
  },
};

const getCheckoutUrlSchema = {
  querystring: {
    type: "object",
    properties: {
      assetId: { type: "string" },
      amount: { type: "number" },
    },
  },
};

module.exports = {
  getBondByIdSchema,
  getAllBondsSchema,
  getBondsByCategorySchema,
  updateBondsInCategorySchema,
  createGripUserSchema,
  getCheckoutUrlSchema
};
