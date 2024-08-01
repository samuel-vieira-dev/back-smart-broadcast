const memoryQueue = require('../utils/MemoryQueue.js');
const facebookService = require('../services/facebookService.js');

exports.sendBroadcast = async (req, res) => {
    const { pageids, message, buttons, schedule, userBroadcastId, n8n } = req.body;
    const appAccessToken = req.headers['app-access-token'];

    if (!appAccessToken) {
        return res.status(400).json({ success: false, error: 'App access token is required' });
    }

    try {
        // Adicionar a tarefa à fila
        await memoryQueue.add(async () => {
            await facebookService.sendBroadcastToPages(pageids, message, buttons, appAccessToken, schedule, userBroadcastId, n8n);
        });

        res.status(200).json({ success: true, message: 'Broadcast job added to the queue.' });
    } catch (error) {
        console.error('Error in broadcast controller:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};
