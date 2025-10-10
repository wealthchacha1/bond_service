const mongoose = require("mongoose");

const bondCategorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
    },
    bondIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bond", // references your Bond collection
        required: true,
      },
    ],
  },
  { 
    timestamps: true,
    collection: "bond_categories" // explicit collection name
  }
);


const BondCategory = mongoose.models.BondCategory || mongoose.model("BondCategory", bondCategorySchema, "bond_categories");

module.exports = BondCategory;
