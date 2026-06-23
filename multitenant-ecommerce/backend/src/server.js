require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const logger = require("./config/logger");
const { startAbandonedCartJob } = require("./jobs/abandonedCart");

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info({ port: PORT }, "Server running");
    });
    // Start background jobs after the DB is connected.
    startAbandonedCartJob();
  } catch (err) {
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  }
})();

// Catch unhandled rejections / exceptions so they are logged, not silent.
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});
process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception");
  process.exit(1);
});
