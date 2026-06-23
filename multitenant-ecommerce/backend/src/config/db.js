const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Connects to MongoDB.
 * For the shared-database multitenancy model, all tenants live in this one
 * connection. When a large tenant later needs database-per-tenant isolation,
 * this is the layer you extend (a connection registry keyed by tenant).
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  await mongoose.connect(uri);
  logger.info('MongoDB connected');
}

module.exports = connectDB;
