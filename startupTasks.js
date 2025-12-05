const cron = require("node-cron");
const BondsController = require("./controllers/bondsController");
const Bond = require("./models/bondsSchema");
const BondService = require("./services/bondService");

async function runGripBondInitialFetch(logger) {
  try {
    // Call the service directly instead of going through controller
    const bondService = new BondService(logger);
    const bondsResponse = await bondService.getAllBonds();

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

    // Collect IDs of bonds received from API
    const receivedBondIds = bondsData.map(bond => bond.id);

    for (const bondData of bondsData) {
      try {
        // Check if bond already exists
        const existingBond = await Bond.findOne({ id: bondData.id });
        
        if (existingBond) {
          // Update existing bond and ensure status is ACTIVE
          await Bond.findOneAndUpdate(
            { id: bondData.id },
            { 
              ...bondData,
              status: 'ACTIVE',
              updatedAt: new Date()
            },
            { new: true }
          );
          updatedCount++;
        } else {
          // Create new bond
          await Bond.create(bondData);
          storedCount++;
        }
      } catch (bondError) {
        errorCount++;
        logger.error({ bondError, bondId: bondData.id }, `Error storing bond with ID: ${bondData.id}`);
      }
    }

    // Mark bonds as INACTIVE if they are not in the received data
    let inactivatedCount = 0;
    try {
      const inactivateResult = await Bond.updateMany(
        { 
          id: { $nin: receivedBondIds },
          status: 'ACTIVE'
        },
        { 
          status: 'INACTIVE',
          updatedAt: new Date()
        }
      );
      inactivatedCount = inactivateResult.modifiedCount || 0;
      
      if (inactivatedCount > 0) {
        logger.info(`Marked ${inactivatedCount} bonds as INACTIVE (not found in API response)`);
      }
    } catch (inactivateError) {
      logger.error({ inactivateError }, "Error marking bonds as INACTIVE");
    }

    const result = {
      totalReceived: bondsData.length,
      stored: storedCount,
      updated: updatedCount,
      inactivated: inactivatedCount,
      errors: errorCount
    };

    return result;
  } catch (error) {
    logger.error({ error }, "Error in running Grip Bond initial data fetch");
    throw error;
  }
}

async function runStartupTasks(logger) {
  try {
    logger.info("Starting startup tasks...");

    // Run initial fetch once at startup
    const result = await runGripBondInitialFetch(logger);
    
    // Schedule daily cron job to run at 1:30 AM
    cron.schedule(
      "30 1 * * *",
      async () => {
        logger.info("Running scheduled Grip Bond initial fetch at 1:30 AM...");
        try {
          await runGripBondInitialFetch(logger);
        } catch (error) {
          logger.error({ error }, "Error in scheduled Grip Bond initial fetch");
        }
      },
      {
        scheduled: true,
        timezone: "Asia/Kolkata", // Adjust timezone as needed
      }
    );
    
    logger.info("Grip Bond initial fetch cron scheduled for daily at 1:30 AM");
    
    return result;
  } catch (error) {
    logger.error({ error }, "Error in startup tasks");
    throw error;
  }
}

module.exports = runStartupTasks;
