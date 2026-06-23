const express = require("express");
const ctrl = require("../controllers/payment.controller");

/**
 * Two routers:
 *  - tenantRouter: checkout (runs inside tenant context). PUBLIC, because the
 *    storefront allows guest checkout — a buyer without an account must be able
 *    to start a payment.
 *  - webhookRouter: MercadoPago notifications (PUBLIC, no tenant context — MP
 *    calls it from outside; it resolves the tenant from the query param).
 */
const tenantRouter = express.Router();
tenantRouter.post("/checkout", ctrl.createPreference);

const webhookRouter = express.Router();
webhookRouter.post("/webhook", ctrl.handleWebhook);

module.exports = { tenantRouter, webhookRouter };
