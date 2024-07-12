class MemoryQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
    }

    async add(task) {
        this.queue.push(task);
        this.processQueue();
    }

    async processQueue() {
        if (this.processing) return;
        this.processing = true;

        while (this.queue.length > 0) {
            const task = this.queue.shift();
            try {
                await task();
            } catch (error) {
                console.error('Error processing task:', error);
            }
        }

        this.processing = false;
    }
}

module.exports = new MemoryQueue();
