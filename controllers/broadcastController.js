const facebookService = require('../services/facebookService');

exports.sendBroadcast = async (req, res) => {
    const { pageIds, message, buttons } = req.body;

    try {
        const { successCount, failureCount } = await facebookService.sendBroadcastToPages(pageIds, message, buttons);
        res.status(200).json({ success: true, message: `Messages sent to ${successCount} contacts, failed to send to ${failureCount} contacts.` });
    } catch (error) {
        console.error('Error in broadcast controller:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};
