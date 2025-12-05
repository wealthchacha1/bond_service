const BondsCategoryService = require("../services/bondsCategoryService");
const { sendSuccess, sendError } = require("../utils/response");

class BondsCategoryController {
  constructor(fastifyLogger) {
    this.bondsCategoryService = new BondsCategoryService(fastifyLogger);

    // Bind methods
    this.getBondsByCategory = this.getBondsByCategory.bind(this);
    this.updateBondsInCategory = this.updateBondsInCategory.bind(this);
    this.getFilterOptions = this.getFilterOptions.bind(this);
  }

  /**
   * Get bonds by category with filters
   */
  async getBondsByCategory(request, reply) {
    try {
      const result = await this.bondsCategoryService.getBondsByCategory({ request });

      return sendSuccess({
        reply,
        message: `Bonds for category fetched successfully`,
        data: result,
      });
    } catch (err) {
      reply.log.error({ err }, "Error in getBondsByCategory");
      return sendError({
        reply,
        message: err.message || "Failed to fetch bonds by category",
        statusCode: 500,
      });
    }
  }

  /**
   * Update bonds in category (Admin only)
   */
  async updateBondsInCategory(request, reply) {
    try {
      if (request.role && request.role.toLowerCase() !== 'admin') {
        return sendError({
          reply,
          message: "Unauthorized: Admin access required",
          statusCode: 403,
        });
      }

      const { addBondIds = [], removeBondIds = [], categoryName } = request.body;

      if (
        (!addBondIds || addBondIds.length === 0) &&
        (!removeBondIds || removeBondIds.length === 0)
      ) {
        return sendError({
          reply,
          message: "At least one of addBondIds or removeBondIds must be provided",
          statusCode: 400,
        });
      }

      const result = await this.bondsCategoryService.updateBondsInCategory({
        addBondIds,
        removeBondIds,
        categoryName,
      });

      return sendSuccess({
        reply,
        message: "Bonds in category updated successfully",
        data: result,
      });
    } catch (err) {
      reply.log.error({ err }, "Error in updateBondsInCategory");
      return sendError({
        reply,
        message: err.message || "Failed to update bonds in category",
        statusCode: 500,
      });
    }
  }

  /**
   * Get available filter options
   */
  async getFilterOptions(request, reply) {
    try {
      const { financeCompanyName } = request.query;
      const result = await this.bondsCategoryService.getFilterOptions({
        financeCompanyName,
      });

      return sendSuccess({
        reply,
        message: "Filter options fetched successfully",
        data: result,
      });
    } catch (err) {
      reply.log.error({ err }, "Error in getFilterOptions");
      return sendError({
        reply,
        message: err.message || "Failed to fetch filter options",
        statusCode: 500,
      });
    }
  }
}

module.exports = BondsCategoryController;
