const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController.js");
const broadcastController = require("../controllers/broadcastController.js");
const settingsController = require("../controllers/settingsController.js");
const paymentController = require("../controllers/paymentController.js");
const stripe = require("stripe")(
  "sk_test_51Q0sqJ1ysMBqZmOfH7VZq7a1ltT3XtA6QFOJeOMXHxOsJ8hGXKqEkQV3nh6ZqyUyv42i2VQsi0EUCuDnkMAhUWsv00MWTgAUez"
);
const authMiddleware = require("../middleware/authMiddleware.js");
const UserSettings = require("../models/UserSettings");
const StripeSession  = require("../models/Payments.js");


const APP_ACCESS_TOKEN = process.env.APP_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL;
const RESPONSE_TEXT = process.env.RESPONSE_TEXT;
const BUTTON_TEXT = process.env.BUTTON_TEXT;
const BUTTON_URL = process.env.BUTTON_URL;
const endpointSecret = "whsec_VCSw7ejftDHEGPhCoDUjVru5sATMSrzC";

// Endpoint que faz envio de broadcast no messenger
router.post("/broadcast/send", broadcastController.sendBroadcast);
router.post("/broadcast/getAllPages", broadcastController.getAllPages);

// Endpoint que pega dados do broad no banco
router.get(
  "/broadcast/getDetails/:userId",
  broadcastController.getDetailsBroad
);
router.get("/broadcast/filter/:userId", broadcastController.filterBroad);

// Endpoint pagamento
router.post("/payment/checkoutSession", paymentController.checkoutSession);

// Endpoint para verificação do webhook
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Armazenar o estado dos usuários
const userState = {};

// Endpoint para receber callbacks do webhook
router.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    body.entry.forEach(async (entry) => {
      if (entry.messaging && entry.messaging[0]) {
        const webhookEvent = entry.messaging[0];
        console.log("Webhook Event:", webhookEvent);

        const senderId = webhookEvent.sender.id;
        const pageId = webhookEvent.recipient.id;

        // Verifica se o usuário já recebeu a mensagem inicial
        if (!userState[senderId]) {
          const pageData = await fetch(
            `https://graph.facebook.com/v20.0/${pageId}?fields=access_token&access_token=${APP_ACCESS_TOKEN}`
          );
          const pageJson = await pageData.json();
          const pageAccessToken = pageJson.access_token;

          const payload = {
            recipient: { id: senderId },
            messaging_type: "RESPONSE",
            message: {
              attachment: {
                type: "template",
                payload: {
                  template_type: "button",
                  text: RESPONSE_TEXT,
                  buttons: [
                    {
                      type: "web_url",
                      url: BUTTON_URL,
                      title: BUTTON_TEXT,
                    },
                  ],
                },
              },
            },
            access_token: pageAccessToken,
          };

          try {
            const response = await fetch(
              `https://graph.facebook.com/v20.0/me/messages`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
              }
            );
            const responseData = await response.json();
            console.log("Message Response:", responseData);

            // Marca o usuário como tendo recebido a mensagem inicial
            userState[senderId] = true;
          } catch (error) {
            console.error("Error sending message:", error);
          }
        }
      }
    });
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});
router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const payload = request.body;
    const payloadString = JSON.stringify(payload, null, 2);
    const secret = endpointSecret;
    const header = stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret,
    });
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        payloadString,
        header,
        secret
      );
    } catch (err) {
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }
    const session = event.data.object;
    const id = session.metadata.userId;

    console.log(event, "------------------------------------ STRIPE WEBHOOK -----------------------------------");
    if (event.type === 'checkout.session.completed') {
      const newStripeSession = new StripeSession({
        id: event.id,
        object: event.object,
        api_version: event.api_version,
        created: event.created,
        data: {
          object: {
            id: session.id,
            object: session.object,
            amount_subtotal: session.amount_subtotal,
            amount_total: session.amount_total,
            currency: session.currency,
            customer: session.customer,
            customer_creation: session.customer_creation,
            customer_email: session.customer_email,
            status: session.status,
            subscription: session.subscription,
            payment_status: session.payment_status,
            invoice: session.invoice,
            success_url: session.success_url,
            metadata: session.metadata,
            created: session.created,
            mode: session.mode,
          },
        },
        livemode: event.livemode,
        pending_webhooks: event.pending_webhooks,
        request: {
          id: event.request?.id,
          idempotency_key: event.request?.idempotency_key,
        },
        type: event.type,
      });
      await newStripeSession.save()

      await UserSettings.updateOne(
        { _id: id },
        { $set: { status: 'ACTIVE', custumerId: session.customer } } 
      );
      response.status(200).send({ received: true });
    }
    else if (event.type === 'invoice.payment_failed' || event.type === 'customer.subscription.deleted') {
      await UserSettings.updateOne(
        { custumerId: session.customer },
        { $set: { status: 'INACTIVE' } } 
      );
    } else {
      response.status(400).send(`Unhandled event type: ${event.type}`);
    }
  }
);
// Endpoint para configurar webhooks em todas as páginas
router.get("/setup-webhooks", async (req, res) => {
  const fetch = (await import("node-fetch")).default;
  try {
    // 1. Listar todas as páginas
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v20.0/me/accounts?access_token=${APP_ACCESS_TOKEN}`
    );
    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      return res.status(400).send("No pages found");
    }

    // 2. Gerar token para setar webhook
    const tokenResponse = await fetch(
      `https://graph.facebook.com/oauth/access_token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`
    );
    const tokenData = await tokenResponse.json();
    const appAccessToken = tokenData.access_token;

    // 3. Setar URL para receber mensagens
    const setWebhookResponse = await fetch(
      `https://graph.facebook.com/v20.0/${CLIENT_ID}/subscriptions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          object: "page",
          callback_url: CALLBACK_URL,
          fields: "messages, messaging_postbacks",
          verify_token: VERIFY_TOKEN,
          access_token: appAccessToken,
        }),
      }
    );

    const setWebhookData = await setWebhookResponse.json();

    if (!setWebhookData.success) {
      return res.status(500).send("Failed to set webhook");
    }

    // 4. Assinar as páginas
    for (const page of pagesData.data) {
      const subscribeResponse = await fetch(
        `https://graph.facebook.com/v20.0/${page.id}/subscribed_apps`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access_token: page.access_token,
            subscribed_fields: "messages",
          }),
        }
      );

      const subscribeData = await subscribeResponse.json();

      if (!subscribeData.success) {
        console.error(`Failed to subscribe page ${page.id}`);
      }
    }

    res.status(200).send("Webhooks set for all pages");
  } catch (error) {
    console.error("Error setting up webhooks:", error);
    res.status(500).send("Internal server error");
  }
});

// Auth routes
router.post("/api/register", authController.register);
router.post("/api/login", authController.login);

// Settings routes
router.get(
  "/api/settings/:userId",
  authMiddleware,
  settingsController.getUserSettings
);
router.post(
  "/api/settings",
  authMiddleware,
  settingsController.saveUserSettings
);

module.exports = router;
