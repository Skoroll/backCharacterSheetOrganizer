require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/userModel");

exports.createCheckoutSession = async (req, res) => {
  const { userId } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: "price_XXXXXXXXXXXX", // ton ID de prix Stripe
          quantity: 1,
        },
      ],
      metadata: { userId },
      success_url: "https://ton-site.fr/premium?success=true",
      cancel_url: "https://ton-site.fr/premium?cancel=true",
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Erreur création session :", error.message);
    res.status(500).json({ error: "Impossible de créer la session" });
  }
};

exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Erreur Webhook :", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata.userId;

    try {
      await User.findByIdAndUpdate(userId, { isPremium: true });
      console.log("✅ Utilisateur mis à jour en premium :", userId);
    } catch (err) {
      console.error("Erreur mise à jour utilisateur :", err.message);
    }
  }

  res.status(200).json({ received: true });
};
