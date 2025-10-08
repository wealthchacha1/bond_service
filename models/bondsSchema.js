const mongoose = require("mongoose");

const bondSchema = new mongoose.Schema(
  {
    // Basic information - matching third party structure
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    schemeName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },

    // Financial details
    interestRate: {
      type: Number,
      required: true,
    },
    effectiveYield: {
      type: Number,
      required: true,
    },
    minAmount: {
      type: Number,
      default: 0,
    },
    maxAmount: {
      type: Number,
      default: 0,
    },

    // Tenure information
    tenureMonths: {
      type: Number,
      default: 0,
    },
    tenureDays: {
      type: Number,
      default: 0,
    },

    // Company information
    financeCompanyName: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      default: "",
    },
    rating: {
      type: String,
      default: "Unrated",
    },

    // Product details
    category: {
      type: String,
      default: "",
    },
    productCategory: {
      type: String,
      default: "",
    },
    productSubCategory: {
      type: String,
      default: "",
    },
    financeProductType: {
      type: String,
      default: "Bonds",
    },

    // Investment details
    minLots: {
      type: Number,
      default: 1,
    },
    maxLots: {
      type: Number,
      default: 1,
    },
    investmentAmount: {
      type: Number,
      default: 0,
    },

    // Additional information
    badges: {
      type: [String],
      default: [],
    },
    isin: {
      type: String,
      default: "",
    },
    returnsType: {
      type: String,
      default: "Yield",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },

    // Calculated fields
    subtitle: {
      type: String,
      default: "",
    },

    // Original data for reference - contains all third party fields
    originalData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // This will contain the complete original API response including:
      // assetID, header, partnerName, description, financeProductType, 
      // assetName, minInvestment, badges, category, returnsType, isin,
      // tenure, preTaxYield, TimeToMaturity, compliantBody, rating, percentageCompletion
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
bondSchema.index({ id: 1 });
bondSchema.index({ financeCompanyName: 1 });
bondSchema.index({ status: 1 });
bondSchema.index({ effectiveYield: -1 });
bondSchema.index({ tenureMonths: 1 });
bondSchema.index({ category: 1 });
bondSchema.index({ rating: 1 });

module.exports = mongoose.model("Bond", bondSchema);