/**
 * ============================================================================
 *  TENANT ISOLATION TEST  --  NON-NEGOTIABLE
 * ============================================================================
 *
 * This test proves the single most important guarantee of the whole system:
 * a query running in tenant A's context can NEVER see or touch tenant B's data.
 *
 * Run it with an in-memory MongoDB (mongodb-memory-server) or a test database.
 *
 *   node --test src/__tests__/isolation.test.js
 */

const test = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");

const Tenant = require("../models/Tenant");
const Product = require("../models/Product");
const { runWithTenant } = require("../plugins/tenantPlugin");

test("tenant isolation", async (t) => {
  // Connect to a TEST database. NEVER point this at production.
  await mongoose.connect(
    process.env.TEST_MONGO_URI || "mongodb://127.0.0.1:27017/mt_test",
  );
  await mongoose.connection.dropDatabase();

  // Create two tenants.
  const tenantA = await Tenant.create({ slug: "store-a", name: "Store A" });
  const tenantB = await Tenant.create({ slug: "store-b", name: "Store B" });

  // Create a product for each tenant, each within its own context.
  await runWithTenant(tenantA._id, async () => {
    await Product.create({ name: "A Product", slug: "a-product", price: 1000 });
  });
  await runWithTenant(tenantB._id, async () => {
    await Product.create({ name: "B Product", slug: "b-product", price: 2000 });
  });

  await t.test("tenant A sees only its own products", async () => {
    await runWithTenant(tenantA._id, async () => {
      const products = await Product.find();
      assert.strictEqual(products.length, 1);
      assert.strictEqual(products[0].name, "A Product");
    });
  });

  await t.test("tenant B sees only its own products", async () => {
    await runWithTenant(tenantB._id, async () => {
      const products = await Product.find();
      assert.strictEqual(products.length, 1);
      assert.strictEqual(products[0].name, "B Product");
    });
  });

  await t.test("tenant A cannot fetch tenant B product by slug", async () => {
    await runWithTenant(tenantA._id, async () => {
      const leaked = await Product.findOne({ slug: "b-product" });
      assert.strictEqual(leaked, null); // isolation holds even with explicit slug
    });
  });

  await t.test("tenant A cannot update tenant B product", async () => {
    // Grab B's product id from B's context.
    let bProductId;
    await runWithTenant(tenantB._id, async () => {
      const p = await Product.findOne({ slug: "b-product" });
      bProductId = p._id;
    });

    // Try to update it from A's context -> should match nothing.
    await runWithTenant(tenantA._id, async () => {
      const updated = await Product.findOneAndUpdate(
        { _id: bProductId },
        { price: 9999 },
        { new: true },
      );
      assert.strictEqual(updated, null);
    });

    // And confirm B's product is untouched.
    await runWithTenant(tenantB._id, async () => {
      const p = await Product.findOne({ slug: "b-product" });
      assert.strictEqual(p.price, 2000);
    });
  });

  await t.test("tenant A cannot delete tenant B product", async () => {
    let bProductId;
    await runWithTenant(tenantB._id, async () => {
      const p = await Product.findOne({ slug: "b-product" });
      bProductId = p._id;
    });

    // deleteOne from A's context must not remove B's product.
    await runWithTenant(tenantA._id, async () => {
      const res = await Product.deleteOne({ _id: bProductId });
      assert.strictEqual(res.deletedCount, 0);
    });

    // B's product still exists.
    await runWithTenant(tenantB._id, async () => {
      const still = await Product.findOne({ _id: bProductId });
      assert.ok(still, "B's product should still exist");
    });
  });

  await t.test(
    "insertMany stamps the current tenant on every doc",
    async () => {
      await runWithTenant(tenantA._id, async () => {
        await Product.insertMany([
          { name: "A Bulk 1", slug: "a-bulk-1", price: 100 },
          { name: "A Bulk 2", slug: "a-bulk-2", price: 200 },
        ]);
      });

      // A now sees its original + 2 bulk = 3, and all belong to A.
      await runWithTenant(tenantA._id, async () => {
        const products = await Product.find();
        assert.strictEqual(products.length, 3);
        products.forEach((p) => {
          assert.strictEqual(String(p.tenantId), String(tenantA._id));
        });
      });

      // B is unaffected — still only its single product.
      await runWithTenant(tenantB._id, async () => {
        const products = await Product.find();
        assert.strictEqual(products.length, 1);
        assert.strictEqual(products[0].name, "B Product");
      });
    },
  );

  await t.test(
    "a query with a FOREIGN tenantId is forced back to the context tenant",
    async () => {
      // This is the exact hole the plugin closes: even if a query explicitly
      // carries another tenant's id, the context tenant must win — never leak.
      await runWithTenant(tenantA._id, async () => {
        // Ask (from A's context) for products belonging to B. Must return
        // A's data, never B's.
        const products = await Product.find({ tenantId: tenantB._id });
        products.forEach((p) => {
          assert.strictEqual(
            String(p.tenantId),
            String(tenantA._id),
            "query must be scoped to the context tenant, not the foreign id",
          );
        });
        // And it must NOT contain B's product.
        const hasB = products.some((p) => p.name === "B Product");
        assert.strictEqual(hasB, false, "must not leak tenant B's product");
      });
    },
  );

  await mongoose.disconnect();
});
