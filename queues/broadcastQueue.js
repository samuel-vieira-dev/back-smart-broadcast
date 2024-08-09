const Queue = require('bull');
const facebookService = require('../services/facebookService');

const broadcastQueue = new Queue('broadcast', {
  redis: {
    host: 'localhost',
    port: 6379
  }
});

broadcastQueue.process(async (job, done) => {
  const { pageIds, message, buttons, appAccessToken, schedule, userId, n8n} = job.data;
  try {
    const { successCount, failureCount } = await facebookService.sendBroadcastToPages(pageIds, message, buttons, appAccessToken, schedule, userId, n8n);
    done(null, { successCount, failureCount });
  } catch (error) {
    done(error);
  }
});

module.exports = broadcastQueue;
