const express = require('express');
const router = express.Router();

const APP_ACCESS_TOKEN = process.env.APP_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL;

// Endpoint para verificação do webhook
router.get('/webhook-messenger', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// Endpoint para receber callbacks do webhook
router.post('/webhook-messenger', async (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(entry => {
            const webhookEvent = entry.messaging[0];
            console.log(webhookEvent);
            // Aqui você pode processar o evento recebido
        });
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// Endpoint para configurar webhooks em todas as páginas
router.get('/setup-webhooks', async (req, res) => {
    const fetch = (await import('node-fetch')).default;
    try {
        // 1. Listar todas as páginas
        const pagesResponse = await fetch(`https://graph.facebook.com/v20.0/me/accounts?access_token=${APP_ACCESS_TOKEN}`);
        const pagesData = await pagesResponse.json();

        if (!pagesData.data || pagesData.data.length === 0) {
            return res.status(400).send('No pages found');
        }

        // 2. Gerar token para setar webhook
        const tokenResponse = await fetch(`https://graph.facebook.com/oauth/access_token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`);
        const tokenData = await tokenResponse.json();
        const appAccessToken = tokenData.access_token;

        // 3. Setar URL para receber mensagens
        const setWebhookResponse = await fetch(`https://graph.facebook.com/v20.0/${CLIENT_ID}/subscriptions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                object: 'page',
                callback_url: CALLBACK_URL,
                fields: 'messages, messaging_postbacks',
                verify_token: VERIFY_TOKEN,
                access_token: appAccessToken
            })
        });

        const setWebhookData = await setWebhookResponse.json();

        if (!setWebhookData.success) {
            return res.status(500).send('Failed to set webhook');
        }

        // 4. Assinar as páginas
        for (const page of pagesData.data) {
            const subscribeResponse = await fetch(`https://graph.facebook.com/v20.0/${page.id}/subscribed_apps`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    access_token: page.access_token,
                    subscribed_fields: 'messages'
                })
            });

            const subscribeData = await subscribeResponse.json();

            if (!subscribeData.success) {
                console.error(`Failed to subscribe page ${page.id}`);
            }
        }

        res.status(200).send('Webhooks set for all pages');
    } catch (error) {
        console.error('Error setting up webhooks:', error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
