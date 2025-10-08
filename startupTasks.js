const BondsController = require("./controllers/bondsController");
const Bond = require("./models/bondsSchema");
const BondService = require("./services/bondService");

async function runGripBondInitialFetch(logger) {
  try {
    // Call the service directly instead of going through controller
    const bondService = new BondService(logger);
    const bondsResponse = await bondService.getAllBonds();
    console.log("Bonds Response:::::::::::::", bondsResponse);

    // Extract bonds data from the response
    const bondsData = bondsResponse.data || [];
    
    if (bondsData.length === 0) {
      logger.warn("No bonds data received from API");
      return { message: "No bonds to store" };
    }

    logger.info(`Received ${bondsData.length} bonds from API`);

    // Store bonds in database
    let storedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const bondData of bondsData) {
      try {
        // Check if bond already exists
        const existingBond = await Bond.findOne({ id: bondData.id });
        
        if (existingBond) {
          // Update existing bond
          await Bond.findOneAndUpdate(
            { id: bondData.id },
            { 
              ...bondData,
              updatedAt: new Date()
            },
            { new: true }
          );
          updatedCount++;
          logger.info(`Updated bond with ID: ${bondData.id}`);
        } else {
          // Create new bond
          await Bond.create(bondData);
          storedCount++;
          logger.info(`Stored new bond with ID: ${bondData.id}`);
        }
      } catch (bondError) {
        errorCount++;
        logger.error({ bondError, bondId: bondData.id }, `Error storing bond with ID: ${bondData.id}`);
      }
    }

    const result = {
      totalReceived: bondsData.length,
      stored: storedCount,
      updated: updatedCount,
      errors: errorCount
    };

    logger.info("Grip Bond data storage completed", result);
    return result;
  } catch (error) {
    logger.error({ error }, "Error in running Grip Bond initial data fetch");
    throw error;
  }
}

async function runStartupTasks(logger) {
  try {
    logger.info("Starting startup tasks...");

    const result = await runGripBondInitialFetch(logger);
    
    logger.info("Startup tasks completed successfully", result);
    return result;
  } catch (error) {
    logger.error({ error }, "Error in startup tasks");
    throw error;
  }
}

module.exports = runStartupTasks;
