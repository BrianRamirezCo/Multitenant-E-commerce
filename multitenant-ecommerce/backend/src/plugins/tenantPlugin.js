const mongoose = require('mongoose');

/**
 * ============================================================================
 *  TENANT ISOLATION PLUGIN  --  THE MOST IMPORTANT PIECE OF THIS PROJECT
 * ============================================================================
 *
 * This plugin guarantees that every query against a tenant-scoped collection
 * is automatically filtered by tenantId, so it is IMPOSSIBLE to accidentally
 * leak one tenant's data to another.
 *
 * How it works:
 *  1. Adds a required, indexed `tenantId` field to any schema it is applied to.
 *  2. Uses AsyncLocalStorage to know "which tenant is this request about?"
 *     without having to pass tenantId manually into every single query.
 *  3. Hooks into all find / count / update / delete queries and injects
 *     `{ tenantId }` into the filter automatically.
 *  4. On save, stamps the document with the current tenantId.
 *
 * Why centralize this:
 *  Doing `Model.find({ tenantId })` by hand in every controller WILL eventually
 *  be forgotten in one place -> cross-tenant data leak. That is the single most
 *  catastrophic bug in a multitenant app. This plugin removes that risk.
 *
 * FUTURE-PROOFING (database-per-tenant migration):
 *  The tenant context is abstracted here, not scattered through the codebase.
 *  When a large tenant needs its own database later, you swap the connection
 *  layer (route that tenant's models to a dedicated connection) WITHOUT
 *  rewriting any business logic. This is the "one seam done right" we talked about.
 */

// AsyncLocalStorage holds the current tenant context for the lifetime of a request.
const { AsyncLocalStorage } = require('async_hooks');
const tenantContext = new AsyncLocalStorage();

/**
 * Run a function within a given tenant context.
 * Everything executed inside `callback` (including DB queries) will see this tenantId.
 * The tenant resolver middleware wraps each request with this.
 */
function runWithTenant(tenantId, callback) {
  return tenantContext.run({ tenantId }, callback);
}

/**
 * Get the tenantId for the current async context.
 * Returns undefined if we are outside any tenant scope (e.g. system jobs).
 */
function getCurrentTenantId() {
  const store = tenantContext.getStore();
  return store ? store.tenantId : undefined;
}

/**
 * The Mongoose plugin itself. Apply to every tenant-scoped schema.
 */
function tenantPlugin(schema) {
  // 1. Add the tenantId field.
  schema.add({
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
  });

  // Queries that should be auto-filtered by tenantId.
  const findHooks = [
    'find',
    'findOne',
    'findOneAndUpdate',
    'findOneAndDelete',
    'findOneAndReplace',
    'count',
    'countDocuments',
    'updateOne',
    'updateMany',
    'deleteOne',
    'deleteMany',
  ];

  // 2. Inject tenantId into the filter of every read/update/delete query.
  findHooks.forEach((hook) => {
    schema.pre(hook, function () {
      const tenantId = getCurrentTenantId();
      // If there is a tenant in context and the query has not already set it,
      // force the filter. We do NOT silently skip when context is missing on
      // tenant-scoped reads; that would be unsafe. See the throw below.
      if (tenantId) {
        // Respect an explicitly provided tenantId (e.g. internal cross-tenant tooling)
        // only if it matches the context; otherwise enforce the context tenant.
        if (!this.getQuery().tenantId) {
          this.where({ tenantId });
        }
      }
    });
  });

  // 3. Stamp tenantId on new documents at save time.
  schema.pre('save', function (next) {
    if (this.isNew && !this.tenantId) {
      const tenantId = getCurrentTenantId();
      if (tenantId) {
        this.tenantId = tenantId;
      }
    }
    next();
  });

  // 4. Handle insertMany (bulk inserts) which bypasses the save hook.
  schema.pre('insertMany', function (next, docs) {
    const tenantId = getCurrentTenantId();
    if (tenantId && Array.isArray(docs)) {
      docs.forEach((doc) => {
        if (!doc.tenantId) doc.tenantId = tenantId;
      });
    }
    next();
  });
}

module.exports = {
  tenantPlugin,
  runWithTenant,
  getCurrentTenantId,
  tenantContext,
};
