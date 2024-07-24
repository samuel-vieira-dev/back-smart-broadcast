const memoryQueue = require('../utils/memoryQueue.js');
const facebookService = require('../services/facebookService.js');

exports.sendBroadcast = async (req, res) => {
    const { pageIds, message, buttons } = req.body;
    const appAccessToken = req.headers['app-access-token'];

    if (!appAccessToken) {
        return res.status(400).json({ success: false, error: 'App access token is required' });
    }

    try {
        // Adicionar a tarefa à fila
        await memoryQueue.add(async () => {
            await facebookService.sendBroadcastToPages(pageIds, message, buttons, appAccessToken);
        });

        res.status(200).json({ success: true, message: 'Broadcast job added to the queue.' });
    } catch (error) {
        console.error('Error in broadcast controller:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};
