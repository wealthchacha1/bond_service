const BondCategory = require("../models/bondsCategories");
const Bond = require("../models/bondsSchema");
const { BOND_STATUS } = require("../applicationConstants");

class BondsCategoryService {
  constructor(logger) {
    this.logger = logger;
  }
  async getBondsByCategory({ request }) {
    const {
      categoryName,
      minInterestRate,
      maxInterestRate,
      minEffectiveYield,
      maxEffectiveYield,
      sortBy = "effectiveYield",
      sortOrder = "desc",
      limit = 20,
      page = 1,
      isSelectedBond = true,
      financeCompanyName,
      rating,
      tenureMonths,
    } = request.body;
    try {
      const skip = (page - 1) * limit;
      let bondQuery = { status: BOND_STATUS.ACTIVE };

      if (isSelectedBond) {
        const category = await BondCategory.findOne({
          categoryName: categoryName.toLowerCase(),
        });

        if (category) {
          // Include bonds from this category
          bondQuery._id = { $in: category.bondIds };
        } else {
          bondQuery._id = { $in: [] };
        }
      } else if (categoryName) {
        const category = await BondCategory.findOne({
          categoryName: categoryName.toLowerCase(),
        });
        const categoryBondIds = category ? category.bondIds : [];
        bondQuery._id = { $nin: categoryBondIds };
      }

      // Apply filters
      if (minInterestRate) {
        bondQuery.interestRate = {
          ...bondQuery.interestRate,
          $gte: parseFloat(minInterestRate),
        };
      }

      if (maxInterestRate) {
        bondQuery.interestRate = {
          ...bondQuery.interestRate,
          $lte: parseFloat(maxInterestRate),
        };
      }

      if (minEffectiveYield) {
        bondQuery.effectiveYield = {
          ...bondQuery.effectiveYield,
          $gte: parseFloat(minEffectiveYield),
        };
      }

      if (maxEffectiveYield) {
        bondQuery.effectiveYield = {
          ...bondQuery.effectiveYield,
          $lte: parseFloat(maxEffectiveYield),
        };
      }

      if (financeCompanyName) {
        bondQuery.financeCompanyName = financeCompanyName;
      }
      
      if (rating) {
        bondQuery.rating = rating;
      }
      
      if (tenureMonths) {
        bondQuery.tenureMonths = tenureMonths;
      }

      // Build sort object
      const sortObj = {};
      if (sortBy === "interestRate") {
        sortObj.interestRate = sortOrder === "desc" ? -1 : 1;
      } else if (sortBy === "effectiveYield") {
        sortObj.effectiveYield = sortOrder === "desc" ? -1 : 1;
      } else if (sortBy === "tenureMonths") {
        sortObj.tenureMonths = sortOrder === "desc" ? -1 : 1;
      }

      this.logger.info({ bondQuery, sortObj }, "Bond Query and Sort");

      const [bonds, totalBonds] = await Promise.all([
        Bond.find(bondQuery).sort(sortObj).skip(skip).limit(limit).exec(),
        Bond.countDocuments(bondQuery),
      ]);

      return {
        bonds,
        total: totalBonds,
        totalPages: Math.ceil(totalBonds / limit),
        appliedFilters: {
          categoryName,
          minInterestRate,
          maxInterestRate,
          minEffectiveYield,
          maxEffectiveYield,
          sortBy,
          sortOrder,
          financeCompanyName,
          rating,
          tenureMonths,
        },
      };
    } catch (error) {
      this.logger.error({ error }, "Error fetching bonds by category");
      throw error;
    }
  }

  /**
   * Add/Remove bonds in a category
   * If category does not exist → create it
   * @param {Object} params
   * @param {string} params.categoryName - Category name
   * @param {Array<string>} [params.addBondIds] - Bonds to add
   * @param {Array<string>} [params.removeBondIds] - Bonds to remove
   * @returns {Promise<Object>} - Updated category
   */
  async updateBondsInCategory({ categoryName, addBondIds = [], removeBondIds = [] }) {
    if (!categoryName) {
      throw new Error("Category name is required");
    }

    if (
      (!addBondIds || addBondIds.length === 0) &&
      (!removeBondIds || removeBondIds.length === 0)
    ) {
      throw new Error(
        "At least one of addBondIds or removeBondIds must be provided"
      );
    }

    this.logger.info(
      { categoryName, addBondIds, removeBondIds },
      "Updating bonds in category"
    );

    // Find existing category
    let category = await BondCategory.findOne({ categoryName });

    if (!category) {
      this.logger.info(
        { categoryName },
        "Category not found, creating new one"
      );

      category = new BondCategory({
        categoryName,
        bondIds: [...new Set(addBondIds)],
      });

      await category.save();

      return {
        category,
        message: "Category created successfully with bonds",
      };
    }

    // Convert bondIds to string for consistency
    let bondIds = category.bondIds.map((id) => id.toString());

    // Remove bonds
    if (removeBondIds.length > 0) {
      bondIds = bondIds.filter((id) => !removeBondIds.includes(id));
    }

    // Add bonds (avoid duplicates)
    if (addBondIds.length > 0) {
      bondIds = [...new Set([...bondIds, ...addBondIds])];
    }

    category.bondIds = bondIds;
    await category.save();

    this.logger.info(
      { categoryName, added: addBondIds.length, removed: removeBondIds.length },
      "Bonds updated in category"
    );

    return {
      category,
      message: "Bonds in category updated successfully",
    };
  }
  
  /**
   * Get available filter options for bonds
   * @returns {Promise<Object>} - Available filter options
   */
  async getFilterOptions({ financeCompanyName }) {
    try {
      const ratingQuery = { status: BOND_STATUS.ACTIVE };
      if (financeCompanyName) {
        ratingQuery.financeCompanyName = financeCompanyName;
      }
      const [
        interestRateRange,
        effectiveYieldRange,
        financeCompanyNames,
        ratings,
        tenureMonths,
      ] = await Promise.all([
        Bond.aggregate([
          { $match: { status: BOND_STATUS.ACTIVE } },
          {
            $group: {
              _id: null,
              minInterestRate: { $min: "$interestRate" },
              maxInterestRate: { $max: "$interestRate" },
            },
          },
        ]),
        Bond.aggregate([
          { $match: { status: BOND_STATUS.ACTIVE } },
          {
            $group: {
              _id: null,
              minEffectiveYield: { $min: "$effectiveYield" },
              maxEffectiveYield: { $max: "$effectiveYield" },
            },
          },
        ]),
        Bond.distinct("financeCompanyName", { status: BOND_STATUS.ACTIVE }),
        Bond.distinct("rating", ratingQuery),
        Bond.distinct("tenureMonths", { status: BOND_STATUS.ACTIVE }),
      ]);

      return {
        interestRate: interestRateRange[0] || { minRate: 0, maxRate: 15 },
        effectiveYield: effectiveYieldRange[0] || { minYield: 0, maxYield: 15 },
        financeCompanyNames: financeCompanyNames.filter(Boolean),
        ratings: ratings.filter(Boolean),
        tenureMonths: tenureMonths.filter(Boolean).sort((a, b) => a - b),
      };
    } catch (error) {
      this.logger.error({ error }, "Error fetching filter options");
      throw error;
    }
  }
}

module.exports = BondsCategoryService;
