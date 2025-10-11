// validators/validator.js
const {
  AGE_GROUPS_ENUM,
  TENURE_ENUM,
  GENDER_ENUM,
  PAYOUT_TYPES_ENUM,
  USER_FILTER_OPTIONS_ENUM,
} = require("../applicationConstants");

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

const authorizationHeaders = {
  type: "object",
  properties: {
    authorization: {
      type: "string",
      pattern: "^Bearer\\s.+",
      description:
        "Authorization header with Bearer token, e.g. Bearer <token>",
    },
  },
  required: ["authorization"],
};

const fdResponse = {
  status: { type: "string" },
  message: { type: "string" },
  data: {
    type: "array",
    items: {
      type: "object",
      properties: {
        fdId: { type: "string" },
        financeCompanyId: { type: "string" },
        financeCompanyName: { type: "string" },
        logo: { type: "string" },
        schemeName: { type: "string" },
        interestRate: { type: "number" },
        rateUnit: {
          type: "string",
        },
        rating: { type: "string" }, // e.g., "AAA", "AA+", etc.
        effectiveYield: { type: "number" },
        cumulative: { type: "boolean" }, // true if cumulative, false if non-cumulative
        tenureMonths: { type: "number" },
        tenureLabel: { type: "string" },
        minAmount: { type: "number" },
        maxAmount: { type: "number" },
        lockInPeriodInMonths: { type: "number" },
        lockInPeriod: { type: "string" },
        payoutType: {
          type: "string",
          enum: PAYOUT_TYPES_ENUM,
        },
        popularityScore: { type: "number" },
        investorsIcons: {
          //this will be profile pics odf investors
          type: "array",
          items: { type: "string" },
        },
        forSenior: { type: "boolean" },
        forWomen: { type: "boolean" },
        forRegular: { type: "boolean" },
        interestOnOneLakh: { type: "number" }, // Interest earned on 1 lakh for popular FDs
        subtitle: { type: "string" }, // for popular subtitle is amount earned on 1L and for chacha picks it is the imp of scheme
      },
    },
  },
  totalFds: {
    type: "number",
  },
  totalPages: { type: "number" },
};

const getPopularFdsSchema = {
  querystring: {
    type: "object",
    properties: {
      limit: { type: "number", default: 4, minimum: 1 },
      page: { type: "number", default: 1, minimum: 1 },
    },
    required: [],
  },
  response: {
    200: {
      type: "object",
      properties: fdResponse,
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
const getChachaPicksSchema = getPopularFdsSchema;

const getFdListByTypeSchema = {
  querystring: {
    type: "object",
    properties: {
      limit: { type: "number", default: 4, minimum: 1 },
      page: { type: "number", default: 1, minimum: 1 },
      type: {
        type: "string",
        enum: [
          "high-returns",
          "short-term",
          "long-term",
          "monthly-payout",
          "child-future",
          "tax-saver",
          "senior-citizen",
          "regular-investor",
          "women-investor",
          "newly-added",
          "chacha-picks",
        ],
      },
    },
    required: ["type"],
  },
  response: getPopularFdsSchema.response,
};

const getFdByIdSchema = {
  params: {
    type: "object",
    properties: {
      fdId: { type: "string" },
    },
    required: ["fdId"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string" },
        message: { type: "string" },
        data: fdResponse.data,
      },
    },
    400: {
      type: "object",
      properties: {
        status: { type: "string" },
        message: { type: "string" },
      },
      required: ["status", "message"],
    },
    404: {
      type: "object",
      properties: {
        status: { type: "string" },
        message: { type: "string" },
      },
      required: ["status", "message"],
    },
    500: {
      type: "object",
      properties: {
        status: { type: "string" },
        message: { type: "string" },
      },
      required: ["status", "message"],
    },
  },
};

const getIssuerPopularFdListSchema = {
  querystring: {
    type: "object",
    properties: {
      limit: { type: "number", default: 4, minimum: 1 },
      page: { type: "number", default: 1, minimum: 1 },
      financeCompanyId: { type: "string" },
      filter: {
        type: "string",
        enum: USER_FILTER_OPTIONS_ENUM,
        default: "regular-investor",
      },
      payoutType: {
        type: "string",
        enum: PAYOUT_TYPES_ENUM,
      },
    },
    required: ["financeCompanyId", "payoutType"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string" },
        message: { type: "string" },
        data: fdResponse.data,
        totalFds: {
          type: "number",
        },
        totalPages: { type: "number" },
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

const chachaComparesSchema = {
  querystring: {
    type: "object",
    properties: {
      fdId: { type: "string" },
    },
    required: ["fdId"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string" },
        message: { type: "string" },
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              fdId: { type: "string" },
              financeCompanyId: { type: "string" },
              financeCompanyName: { type: "string" },
              logo: { type: "string" },
              schemeName: { type: "string" },
              interestRate: { type: "number" },
              rateUnit: {
                type: "string",
              },
              rating: { type: "string" }, // e.g., "AAA", "AA+", etc.
              effectiveYield: { type: "number" },
              cumulative: { type: "boolean" }, // true if cumulative, false if non-cumulative
              tenureMonths: { type: "number" },
              tenureLabel: { type: "string" },
              minAmount: { type: "number" },
              maxAmount: { type: "number" },
              lockInPeriodInMonths: { type: "number" },
              lockInPeriod: { type: "string" },
              payoutType: {
                type: "string",
                enum: PAYOUT_TYPES_ENUM,
              },
              popularityScore: { type: "number" },
              forSenior: { type: "boolean" },
              forWomen: { type: "boolean" },
              forRegular: { type: "boolean" },
            },
          },
        },
        fdChachaTip: { type: "string" }, // Additional tip for the FD
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

const recommendedFdsSchema = {
  body: {
    type: "object",
    properties: {
      limit: { type: "number", default: 4, minimum: 1 },
      page: { type: "number", default: 1, minimum: 1 },
      term: {
        type: "string",
        enum: TENURE_ENUM,
      },
      gender: {
        type: "string",
        enum: GENDER_ENUM,
      },
      ageGroup: {
        type: "string",
        enum: AGE_GROUPS_ENUM,
      },
    },
    required: ["term", "gender", "ageGroup"],
  },
  response: getPopularFdsSchema.response,
};

const compareFdsSchema = {
  querystring: {
    type: "object",
    properties: {
      fdIds: {
        type: "array",
        items: { type: "string" },
        minItems: 2,
        maxItems: 10,
        uniqueItems: true,
      },
    },
    required: ["fdIds"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string" },
        message: { type: "string" },
        data: {
          type: "array",
          items: fdResponse.data.items,
        },
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

const getSuggestedFdsSchema = {
  body: {
    type: "object",
    properties: {
      limit: { type: "number", default: 4, minimum: 1 },
      page: { type: "number", default: 1, minimum: 1 },
      amount: { type: "number", minimum: 5000 },
      tenureMonths: {
        type: "string",
        enum: ["12", "18", "24", "30", "36", "42", "50", "60"], // Tenure in months
      },
    },
    required: ["amount", "tenureMonths"],
  },
  response: getPopularFdsSchema.response,
};

const calculateFdSchema = {
  body: {
    type: "object",
    properties: {
      fdId: { type: "string" }, // FD ID for which to calculate
      principal: { type: "number", minimum: 5000 },
      forSenior: { type: "boolean", default: false },
      gender: {
        type: "string",
        enum: GENDER_ENUM,
      },
    },
    required: ["fdId", "principal"],
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
            interestRate: { type: "number" }, // Interest rate
            maturityAmount: { type: "number" }, // Total amount after maturity
            periodicInterestAmount: { type: "number" }, // Interest payout amount
            totalInterestEarnings: { type: "number" }, // Total interest earned
            maturityDate: { type: "string" }, // Maturity date
            payoutFrequency: { type: "string" }, // Frequency of interest payout (e.g., monthly, quarterly, annually)
            rating: { type: "string" }, // e.g., "AAA", "AA+", etc.
            effectiveYield: { type: "number" },
            effectiveAnnualYieldDefinition: {
              type: "string",
              default:
                "Effective annual yield is the annualized return on an investment, taking into account the effects of compounding.",
            },
          }, // Result of the FD calculation
        },
      },
    },
    400: {
      type: "object",
      properties: { status: { type: "string" }, message: { type: "string" } },
    },
    500: {
      type: "object",
      properties: { status: { type: "string" }, message: { type: "string" } },
    },
  },
};
const getAllFcFdsSchema = {
  querystring: {
    type: "object",
    properties: {
      financeCompanyId: { type: "string" },
    },
    required: [],
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string" },
        message: { type: "string" },
        data: {
          type: "object",
          additionalProperties: true,
        },
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

const getPayoutAndBenefitsSchema = {
  querystring: {
    type: "object",
    properties: {
      fdId: { type: "string" },
    },
    required: ["fdId"],
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
            payoutTypesFds: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  payoutType: {
                    type: "string",
                    enum: PAYOUT_TYPES_ENUM,
                  },
                  fdId: { type: "string" }, // FD ID associated with the payout type
                },
              },
            },
            additionalBenefits: {
              type: "object",
              properties: {
                senior: { type: "string" },
                women: { type: "string" },
              },
            },
          },
        },
      },
    },
    400: {
      type: "object",
      properties: { status: { type: "string" }, message: { type: "string" } },
    },
    500: {
      type: "object",
      properties: { status: { type: "string" }, message: { type: "string" } },
    },
  },
};

const getUnityFdUrlSchema = {
  headers: authorizationHeaders,
  querystring: {
    type: "object",
    properties: {
      fdId: { type: "string" },
      amount: { type: "number" },
      userId: { type: "string" }, // User ID
    },
    required: ["fdId", "amount"],
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
            redirectUrl: { type: "string" }, // Redirect URL after payment
          },
        },
      },
    },
    400: {
      type: "object",
      properties: { status: { type: "string" }, message: { type: "string" } },
    },
    500: {
      type: "object",
      properties: { status: { type: "string" }, message: { type: "string" } },
    },
  },
};

const getFdsByCategorySchema = {
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
      payoutType: {
        type: "string",
        enum: PAYOUT_TYPES_ENUM,
      },
      financeCompanyName: {
        type: "string",
      },
      isSelectedFd: {
        type: "boolean",
        default: true,
      },
      tenureLabel: { type: "string" },
      sortBy: {
        type: "string",
        enum: ["interestRate"],
        default: "interestRate",
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
            fds: {
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
                payoutType: { type: "string" },
                sortBy: { type: "string" },
                sortOrder: { type: "string" },
                financeCompanyName: { type: "string" },
                isSelectedFd: { type: "boolean" },
              },
              additionalProperties: false,
            },
          },
          required: ["fds", "total", "totalPages", "appliedFilters"],
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

const updateFdsInCategorySchema = {
  body: {
    type: "object",
    properties: {
      categoryName: {
        type: "string",
      },
      addFdIds: {
        type: "array",
        items: { type: "string" },
        default: [],
      },
      removeFdIds: {
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

const getFilterOptionsSchema = {
  querystring: {
    type: "object",
    properties: {
      financeCompanyName: {
        type: "string",
      },
    },
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
            interestRate: {
              type: "object",
              properties: {
                minInterestRate: { type: "number" },
                maxInterestRate: { type: "number" },
              },
            },
            payoutTypes: {
              type: "array",
              items: { type: "string" },
            },
            financeCompanyNames: {
              type: "array",
              items: { type: "string" },
            },
            tenureLabels: {
              type: "array",
              items: { type: "string" },
            },
            categories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  value: { type: "string" },
                  label: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    400: {
      type: "object",
      properties: { status: { type: "string" }, message: { type: "string" } },
    },
    500: {
      type: "object",
      properties: { status: { type: "string" }, message: { type: "string" } },
    },
  },
};

const getPopularBondsSchema = {
  querystring: {
    type: "object",
    properties: {
      limit: { type: "integer", minimum: 1, maximum: 50, default: 4 },
      page: { type: "integer", minimum: 1, default: 1 },
    },
  },
  response: {
    200: bondResponse,
  },
};

const getBondListByTypeSchema = {
  querystring: {
    type: "object",
    properties: {
      type: { type: "string" },
      userId: { type: "string" },
      limit: { type: "integer", minimum: 1, maximum: 50, default: 4 },
      page: { type: "integer", minimum: 1, default: 1 },
    },
    required: ["type"],
  },
  response: {
    200: bondResponse,
  },
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

const getIssuerPopularBondListSchema = {
  querystring: {
    type: "object",
    properties: {
      financeCompanyId: { type: "string" },
      limit: { type: "integer", minimum: 1, maximum: 50, default: 4 },
      page: { type: "integer", minimum: 1, default: 1 },
      filter: { type: "string", default: "regular-investor" },
    },
    required: ["financeCompanyId"],
  },
  response: {
    200: bondResponse,
  },
};

// const chachaComparesSchema = {
//   querystring: {
//     type: "object",
//     properties: {
//       bondId: { type: "string" },
//     },
//     required: ["bondId"],
//   },
//   response: {
//     200: bondResponse,
//   },
// };

const recommendedBondsSchema = {
  body: {
    type: "object",
    properties: {
      ageGroup: { type: "string" },
      gender: { type: "string" },
      term: { type: "string" },
      limit: { type: "integer", minimum: 1, maximum: 50, default: 4 },
      page: { type: "integer", minimum: 1, default: 1 },
    },
  },
  response: {
    200: bondResponse,
  },
};

const compareBondsSchema = {
  querystring: {
    type: "object",
    properties: {
      bondIds: { type: "array", items: { type: "string" } },
    },
    required: ["bondIds"],
  },
  response: {
    200: bondResponse,
  },
};

const calculateBondSchema = {
  body: {
    type: "object",
    properties: {
      username: { type: "string" },
      assetId: { type: "number" },
      amount: { type: "number", default: 10000 },
    },
    required: ["username", "assetId"],
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

const getSuggestedBondsSchema = {
  body: {
    type: "object",
    properties: {
      limit: { type: "integer", minimum: 1, maximum: 50, default: 4 },
      page: { type: "integer", minimum: 1, default: 1 },
      amount: { type: "number" },
      tenureMonths: { type: "number" },
    },
  },
  response: {
    200: bondResponse,
  },
};

const getAllGripBondsSchema = {
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

const getBondDetailsSchema = {
  querystring: {
    type: "object",
    properties: {
      bondId: { type: "string" },
    },
    required: ["bondId"],
  },
  response: {
    200: bondResponse,
  },
};

// const getChachaPicksSchema = {
//   querystring: {
//     type: "object",
//     properties: {
//       limit: { type: "integer", minimum: 1, maximum: 50, default: 4 },
//       page: { type: "integer", minimum: 1, default: 1 },
//     },
//   },
//   response: {
//     200: bondResponse,
//   },
// };

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

const getAllBondsFromDBSchema = {
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

const getBondFilterOptionsSchema = {
  querystring: {
    type: "object",
    properties: {
      financeCompanyName: {
        type: "string",
      },
    },
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
            interestRate: {
              type: "object",
              properties: {
                minInterestRate: { type: "number" },
                maxInterestRate: { type: "number" },
              },
            },
            effectiveYield: {
              type: "object",
              properties: {
                minEffectiveYield: { type: "number" },
                maxEffectiveYield: { type: "number" },
              },
            },
            financeCompanyNames: {
              type: "array",
              items: { type: "string" },
            },
            ratings: {
              type: "array",
              items: { type: "string" },
            },
            tenureMonths: {
              type: "array",
              items: { type: "number" },
            },
          },
        },
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

module.exports = {
  getPopularFdsSchema,
  chachaComparesSchema,
  getIssuerPopularFdListSchema,
  getFdListByTypeSchema,
  getFdByIdSchema,
  recommendedFdsSchema,
  compareFdsSchema,
  calculateFdSchema,
  getSuggestedFdsSchema,
  getAllFcFdsSchema,
  getPayoutAndBenefitsSchema,
  getChachaPicksSchema,
  getUnityFdUrlSchema,
  // FD Category schemas
  getFdsByCategorySchema,
  updateFdsInCategorySchema,
  getFilterOptionsSchema,
  // Bond-specific schemas
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
  // Bond Category schemas
  getBondsByCategorySchema,
  updateBondsInCategorySchema,
  getBondFilterOptionsSchema,
};
