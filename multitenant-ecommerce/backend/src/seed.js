require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Tenant = require("./models/Tenant");
const Product = require("./models/Product");
const User = require("./models/User");
const { runWithTenant } = require("./plugins/tenantPlugin");
const { hashPassword } = require("./modules/auth/services/password");

/**
 * Seeds two demo stores with products + an admin user each.
 *
 * Deletes existing tenants, their products and users first, so re-running this
 * gives a clean state (no duplicates).
 *
 * Admin logins (after seeding):
 *   store-a -> admin@store-a.com / password123
 *   store-b -> admin@store-b.com / password123
 */
(async () => {
  try {
    await connectDB();

    // Find existing demo tenants to clean their related data.
    const existing = await Tenant.find({
      slug: { $in: ["store-a", "store-b"] },
    });
    const existingIds = existing.map((t) => t._id);

    // Clean products and users of those tenants, then the tenants themselves.
    if (existingIds.length) {
      await Product.deleteMany({ tenantId: { $in: existingIds } });
      await User.deleteMany({ tenantId: { $in: existingIds } });
    }
    await Tenant.deleteMany({ slug: { $in: ["store-a", "store-b"] } });

    // Recreate tenants.
    const tenantA = await Tenant.create({
      slug: "store-a",
      name: "Mindful Store A",
    });
    const tenantB = await Tenant.create({
      slug: "store-b",
      name: "Sport Store B",
    });

    // --- Products ---
    await runWithTenant(tenantA._id, async () => {
      await Product.insertMany([
        {
          name: "Meditation Cushion",
          slug: "meditation-cushion",
          price: 350000,
          stock: 20,
        },
        { name: "Incense Set", slug: "incense-set", price: 120000, stock: 50 },
      ]);
    });

    await runWithTenant(tenantB._id, async () => {
      await Product.insertMany([
        {
          name: "Running Shoes",
          slug: "running-shoes",
          price: 8000000,
          stock: 15,
        },
        { name: "Sport Socks", slug: "sport-socks", price: 400000, stock: 100 },
      ]);
    });

    // --- Admin users (one per store) ---
    const passwordHash = await hashPassword("password123");

    await User.insertMany([
      {
        tenantId: tenantA._id,
        name: "Admin Store A",
        email: "admin@store-a.com",
        password: passwordHash,
        role: "admin",
      },
      {
        tenantId: tenantB._id,
        name: "Admin Store B",
        email: "admin@store-b.com",
        password: passwordHash,
        role: "admin",
      },
    ]);

    console.log("Seed complete (clean state).");
    console.log("Admin store-a: admin@store-a.com / password123");
    console.log("Admin store-b: admin@store-b.com / password123");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
})();
