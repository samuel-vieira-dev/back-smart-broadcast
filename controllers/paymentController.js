// TROCAR PARA A CHAVE DE PROD
const stripe = require('stripe')('sk_test_51Q0sqJ1ysMBqZmOfH7VZq7a1ltT3XtA6QFOJeOMXHxOsJ8hGXKqEkQV3nh6ZqyUyv42i2VQsi0EUCuDnkMAhUWsv00MWTgAUez');

const checkoutSession = async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price: "price_1Q1AKu1ysMBqZmOfY3wnEYms",
            quantity: 1,
          },
        ],
        success_url: "https://webhook-messenger-67627eb7cfd0.herokuapp.com/success?session_id={CHECKOUT_SESSION_ID}",
        metadata:{
          userId:req.body.userId
        }
      });
      res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { checkoutSession };
