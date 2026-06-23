const bcrypt = require('bcryptjs');

/**
 * Password hashing utilities (bcrypt).
 *
 * bcrypt automatically salts each hash, so identical passwords produce
 * different hashes. Cost factor 12 is a good balance of security/speed in 2024.
 */
const SALT_ROUNDS = 12;

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, comparePassword };
