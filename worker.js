const broadcastQueue = require('./queues/broadcastQueue');

broadcastQueue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed with result`, result);
});

broadcastQueue.on('failed', (job, err) => {
    console.log(`Job ${job.id} failed with error`, err);
});

console.log('Worker started');
