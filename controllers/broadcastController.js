const facebookService = require('../services/facebookService');

exports.sendBroadcast = async (req, res) => {
    const { pageIds, message, buttons } = req.body;
    const appAccessToken = req.headers['app-access-token'];

    if (!appAccessToken) {
        return res.status(400).json({ success: false, error: 'App access token is required' });
    }

    try {
        const { successCount, failureCount } = await facebookService.sendBroadcastToPages(pageIds, message, buttons, appAccessToken);
        res.status(200).json({ success: true, message: `Messages sent to ${successCount} contacts, failed to send to ${failureCount} contacts.` });
    } catch (error) {
        console.error('Error in broadcast controller:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};
