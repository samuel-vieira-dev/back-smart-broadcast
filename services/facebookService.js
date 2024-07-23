const axios = require('axios');

const getPages = async (appAccessToken) => {
    try {
        const pagesUrl = `https://graph.facebook.com/v20.0/me/accounts?access_token=${appAccessToken}`;
        const response = await axios.get(pagesUrl);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching pages:', error.response ? error.response.data : error.message);
        throw new Error('Failed to fetch pages');
    }
};

const getPageAccessToken = async (pageId, appAccessToken) => {
    try {
        const pages = await getPages(appAccessToken);
        const page = pages.find(page => page.id === pageId);
        if (!page) {
            console.error(`Access token not found for page ID: ${pageId}`);
            throw new Error(`Access token not found for page ID: ${pageId}`);
        }
        return page.access_token;
    } catch (error) {
        console.error('Error getting page access token:', error.message);
        throw error;
    }
};

const getConversationsFromPage = async (pageId, pageAccessToken) => {
    try {
        const conversationsUrl = `https://graph.facebook.com/v20.0/${pageId}/conversations?access_token=${pageAccessToken}&limit=5`;
        const response = await axios.get(conversationsUrl);
        return response.data.data;
    } catch (error) {
        console.error(`Error fetching conversations from page ${pageId}:`, error.response ? error.response.data : error.message);
        throw new Error(`Failed to fetch conversations from page ID: ${pageId}`);
    }
};

const getMessagesFromConversation = async (conversationId, pageAccessToken) => {
    try {
        const messagesUrl = `https://graph.facebook.com/v20.0/${conversationId}/messages?access_token=${pageAccessToken}`;
        const response = await axios.get(messagesUrl);
        return response.data.data;
    } catch (error) {
        console.error(`Error fetching messages from conversation ${conversationId}:`, error.response ? error.response.data : error.message);
        throw new Error(`Failed to fetch messages from conversation ID: ${conversationId}`);
    }
};

const getMessageDetails = async (messageId, pageAccessToken) => {
    try {
        const messageDetailsUrl = `https://graph.facebook.com/v20.0/${messageId}?fields=id,created_time,from,to,message&access_token=${pageAccessToken}`;
        const response = await axios.get(messageDetailsUrl);
        return response.data;
    } catch (error) {
        console.error(`Error fetching message details for message ${messageId}:`, error.response ? error.response.data : error.message);
        throw new Error(`Failed to fetch message details for message ID: ${messageId}`);
    }
};

const sendMessage = async (pageId, pageAccessToken, userId, message, buttons) => {
    try {
        const sendMessageUrl = `https://graph.facebook.com/v20.0/${pageId}/messages`;
        const payload = {
            recipient: { id: userId },
            tag: 'ACCOUNT_UPDATE',
            access_token: pageAccessToken
        };

        if (buttons && buttons.length > 0) {
            payload.message = {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: message,
                        buttons: buttons
                    }
                }
            };
        } else {
            payload.message = { text: message };
        }

        const response = await axios.post(sendMessageUrl, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log(`Message sent to user ${userId} from page ${pageId} with tag ACCOUNT_UPDATE:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error sending message to user ${userId} from page ${pageId} with tag ACCOUNT_UPDATE:`, error.response ? error.response.data : error.message);
        throw new Error(`Failed to send message to user ID: ${userId} from page ID: ${pageId}`);
    }
};

exports.sendBroadcastToPages = async (pageIds, message, buttons, appAccessToken) => {
    let successCount = 0;
    let failureCount = 0;

    const pagePromises = pageIds.map(async (pageId) => {
        try {
            const pageAccessToken = await getPageAccessToken(pageId, appAccessToken);
            const conversations = await getConversationsFromPage(pageId, pageAccessToken);

            const conversationPromises = conversations.map(async (conversation) => {
                const messages = await getMessagesFromConversation(conversation.id, pageAccessToken);
                if (messages.length > 0) {
                    const messageDetails = await getMessageDetails(messages[0].id, pageAccessToken);
                    const userId = messageDetails.from.id !== pageId ? messageDetails.from.id : messageDetails.to.data[0].id;
                    const username = messageDetails.from.id !== pageId ? messageDetails.from.name : messageDetails.to.data[0].name;
                    console.log(`==USERNAME: ${username} ==`)
                    try {
                        await sendMessage(pageId, pageAccessToken, userId, message, buttons);
                        successCount++;
                    } catch (error) {
                        failureCount++;
                    }
                }
            });

            await Promise.all(conversationPromises);
        } catch (error) {
            console.error(`Error in processing page ID ${pageId}:`, error.message);
        }
    });

    await Promise.all(pagePromises);

    return { successCount, failureCount };
};
