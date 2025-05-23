const express = require("express");
const router = express.Router();
const stripeController = require("../controllers/stripeController");

// Créer une session de paiement
router.post("/create-checkout-session", stripeController.createCheckoutSession);

// Webhook Stripe (utilise express.raw dans server.js)
router.post("/webhook", stripeController.handleWebhook);

module.exports = router;
