/**
 * ============================================================================
 *  TENANT ISOLATION TEST  --  NON-NEGOTIABLE
 * ============================================================================
 *
 * This test proves the single most important guarantee of the whole system:
 * a query running in tenant A's context can NEVER see tenant B's data.
 *
 * Run it with an in-memory MongoDB (mongodb-memory-server) or a test database.
 * This is a template using Node's built-in test runner; adapt to Jest if you
 * prefer (Lumina-style).
 *
 *   node --test src/__tests__/isolation.test.js
 */

const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

const Tenant = require('../models/Tenant');
const Product = require('../models/Product');
const { runWithTenant } = require('../plugins/tenantPlugin');

test('tenant isolation', async (t) => {
  // Connect to a TEST database. NEVER point this at production.
  await mongoose.connect(process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/mt_test');
  await mongoose.connection.dropDatabase();

  // Create two tenants.
  const tenantA = await Tenant.create({ slug: 'store-a', name: 'Store A' });
  const tenantB = await Tenant.create({ slug: 'store-b', name: 'Store B' });

  // Create a product for each tenant, each within its own context.
  await runWithTenant(tenantA._id, async () => {
    await Product.create({ name: 'A Product', slug: 'a-product', price: 1000 });
  });
  await runWithTenant(tenantB._id, async () => {
    await Product.create({ name: 'B Product', slug: 'b-product', price: 2000 });
  });

  await t.test('tenant A sees only its own products', async () => {
    await runWithTenant(tenantA._id, async () => {
      const products = await Product.find();
      assert.strictEqual(products.length, 1);
      assert.strictEqual(products[0].name, 'A Product');
    });
  });

  await t.test('tenant B sees only its own products', async () => {
    await runWithTenant(tenantB._id, async () => {
      const products = await Product.find();
      assert.strictEqual(products.length, 1);
      assert.strictEqual(products[0].name, 'B Product');
    });
  });

  await t.test('tenant A cannot fetch tenant B product by slug', async () => {
    await runWithTenant(tenantA._id, async () => {
      const leaked = await Product.findOne({ slug: 'b-product' });
      assert.strictEqual(leaked, null); // isolation holds even with explicit slug
    });
  });

  await t.test('tenant A cannot update tenant B product', async () => {
    // Grab B's product id from B's context.
    let bProductId;
    await runWithTenant(tenantB._id, async () => {
      const p = await Product.findOne({ slug: 'b-product' });
      bProductId = p._id;
    });

    // Try to update it from A's context -> should match nothing.
    await runWithTenant(tenantA._id, async () => {
      const updated = await Product.findOneAndUpdate(
        { _id: bProductId },
        { price: 9999 },
        { new: true }
      );
      assert.strictEqual(updated, null);
    });
  });

  await mongoose.disconnect();
});
