const Queue = require('bull');
const facebookService = require('../services/facebookService');

const broadcastQueue = new Queue('broadcast', {
  redis: {
    host: 'localhost',
    port: 6379
  }
});

broadcastQueue.process(async (job, done) => {
  const { pageIds, message, buttons, appAccessToken } = job.data;
  try {
    const { successCount, failureCount } = await facebookService.sendBroadcastToPages(pageIds, message, buttons, appAccessToken);
    done(null, { successCount, failureCount });
  } catch (error) {
    done(error);
  }
});

module.exports = broadcastQueue;
