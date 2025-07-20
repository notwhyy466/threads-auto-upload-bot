const logger = require('./utils/logger');
const ThreadsBot = require('./threads-bot');

class SimpleScheduler {
    constructor(existingBot = null) {
        this.scheduledTasks = new Map();
        this.bot = existingBot; // Use existing bot if provided
        this.ownBot = !existingBot; // Track if we own the bot instance
        logger.info('📅 Simple Thread Scheduler initialized');
    }

    /**
     * Set an existing bot instance
     */
    setBot(existingBot) {
        if (this.bot && this.ownBot) {
            // Close our own bot if we have one
            this.bot.close();
        }
        this.bot = existingBot;
        this.ownBot = false;
        logger.info('✅ Using existing bot instance');
    }

    /**
     * Get or create bot instance
     */
    async getBotInstance() {
        if (!this.bot) {
            this.bot = new ThreadsBot();
            this.ownBot = true;
            await this.bot.initialize();
        }
        return this.bot;
    }

    /**
     * Schedule a single thread to be posted at a specific time using setTimeout
     * @param {string} content - The thread content
     * @param {Date|string} scheduleTime - When to post the thread
     * @param {string} taskId - Unique identifier for this task
     */
    scheduleThread(content, scheduleTime, taskId) {
        const time = new Date(scheduleTime);
        const now = new Date();
        const delay = time.getTime() - now.getTime();
        
        if (delay <= 0) {
            logger.warn(`⚠️ Schedule time is in the past for task ${taskId}, posting immediately`);
            this.executeThreadPost(content, taskId);
            return taskId;
        }

        const timeoutId = setTimeout(async () => {
            await this.executeThreadPost(content, taskId);
        }, delay);

        this.scheduledTasks.set(taskId, {
            timeoutId,
            content,
            scheduleTime: time,
            type: 'single'
        });

        logger.info(`📝 Thread scheduled for ${time.toLocaleString('id-ID')} with ID: ${taskId}`);
        logger.info(`⏳ Will execute in ${Math.round(delay / 1000)} seconds`);
        return taskId;
    }

    /**
     * Schedule a thread chain to be posted at a specific time using setTimeout
     * @param {Array} threadParts - Array of thread content parts
     * @param {Date|string} scheduleTime - When to post the thread chain
     * @param {string} taskId - Unique identifier for this task
     */
    scheduleThreadChain(threadParts, scheduleTime, taskId) {
        const time = new Date(scheduleTime);
        const now = new Date();
        const delay = time.getTime() - now.getTime();
        
        if (delay <= 0) {
            logger.warn(`⚠️ Schedule time is in the past for task ${taskId}, posting immediately`);
            this.executeThreadChainPost(threadParts, taskId);
            return taskId;
        }

        const timeoutId = setTimeout(async () => {
            await this.executeThreadChainPost(threadParts, taskId);
        }, delay);

        this.scheduledTasks.set(taskId, {
            timeoutId,
            threadParts,
            scheduleTime: time,
            type: 'chain'
        });

        logger.info(`🧵 Thread chain scheduled for ${time.toLocaleString('id-ID')} with ID: ${taskId}`);
        logger.info(`⏳ Will execute in ${Math.round(delay / 1000)} seconds`);
        return taskId;
    }

    /**
     * Get next scheduled task info
     */
    getNextScheduledTask() {
        if (this.scheduledTasks.size === 0) {
            return null;
        }

        // Find the task with the earliest schedule time
        let nextTask = null;
        let earliestTime = null;

        for (const [taskId, taskInfo] of this.scheduledTasks) {
            if (!earliestTime || taskInfo.scheduleTime < earliestTime) {
                earliestTime = taskInfo.scheduleTime;
                nextTask = { id: taskId, ...taskInfo };
            }
        }

        return nextTask;
    }

    /**
     * Display next post info
     */
    showNextPostInfo() {
        const nextTask = this.getNextScheduledTask();
        
        if (nextTask) {
            const now = new Date();
            const timeLeft = nextTask.scheduleTime.getTime() - now.getTime();
            
            if (timeLeft > 0) {
                const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                const secondsLeft = Math.floor((timeLeft % (1000 * 60)) / 1000);
                
                const timeString = hoursLeft > 0 
                    ? `${hoursLeft}h ${minutesLeft}m` 
                    : minutesLeft > 0 
                        ? `${minutesLeft}m ${secondsLeft}s`
                        : `${secondsLeft}s`;
                
                logger.info(`⏰ Next post scheduled: ${nextTask.scheduleTime.toLocaleString('id-ID')} (in ${timeString})`);
                logger.info(`📝 Type: ${nextTask.type === 'chain' ? 'Thread Chain' : 'Single Thread'}`);
                
                if (nextTask.content) {
                    const preview = nextTask.type === 'chain' 
                        ? nextTask.content[0]?.substring(0, 60) 
                        : nextTask.content.substring(0, 60);
                    logger.info(`👀 Preview: "${preview}..."`);
                }
            } else {
                logger.info(`⚠️ Next task is overdue: ${nextTask.scheduleTime.toLocaleString('id-ID')}`);
            }
        } else {
            logger.info(`📭 No more scheduled posts`);
        }
    }

    /**
     * Execute single thread posting
     */
    async executeThreadPost(content, taskId) {
        try {
            logger.info(`🎯 Executing scheduled thread: ${taskId}`);
            const bot = await this.getBotInstance();
            await bot.postThread(content);
            logger.info(`✅ Successfully posted scheduled thread: ${taskId}`);
            
            // Remove completed task
            this.scheduledTasks.delete(taskId);
            
            // Show next post info
            this.showNextPostInfo();
            
        } catch (error) {
            logger.error(`❌ Failed to post scheduled thread ${taskId}:`, error);
            
            // Remove failed task
            this.scheduledTasks.delete(taskId);
            
            // Show next post info even after failure
            this.showNextPostInfo();
        }
    }

    /**
     * Execute thread chain posting
     */
    async executeThreadChainPost(threadParts, taskId) {
        try {
            logger.info(`🎯 Executing scheduled thread chain: ${taskId}`);
            const bot = await this.getBotInstance();
            await bot.createThreadChain(threadParts);
            logger.info(`✅ Successfully posted scheduled thread chain: ${taskId} (${threadParts.length} parts)`);
            
            // Remove completed task
            this.scheduledTasks.delete(taskId);
            
            // Show next post info
            this.showNextPostInfo();
            
        } catch (error) {
            logger.error(`❌ Failed to post scheduled thread chain ${taskId}:`, error);
            
            // Retry logic for critical errors
            if (error.message.includes('Target closed') || 
                error.message.includes('Protocol error') ||
                error.message.includes('browser') ||
                error.message.includes('page')) {
                
                logger.warn(`⚠️ Browser error detected for task ${taskId}, will retry in 30 seconds...`);
                
                // Schedule retry in 30 seconds
                setTimeout(async () => {
                    try {
                        logger.info(`🔄 Retrying failed task: ${taskId}`);
                        const bot = await this.getBotInstance();
                        await bot.createThreadChain(threadParts);
                        logger.info(`✅ Retry successful for task: ${taskId}`);
                        this.scheduledTasks.delete(taskId);
                        
                        // Show next post info after successful retry
                        this.showNextPostInfo();
                        
                    } catch (retryError) {
                        logger.error(`❌ Retry also failed for task ${taskId}:`, retryError);
                        this.scheduledTasks.delete(taskId);
                        
                        // Show next post info even after retry failure
                        this.showNextPostInfo();
                    }
                }, 30000);
            } else {
                // Remove failed task for other errors
                this.scheduledTasks.delete(taskId);
                
                // Show next post info even after failure
                this.showNextPostInfo();
            }
        }
    }

    /**
     * Cancel a scheduled task
     * @param {string} taskId - The task ID to cancel
     */
    cancelScheduledTask(taskId) {
        const scheduledTask = this.scheduledTasks.get(taskId);
        if (scheduledTask) {
            clearTimeout(scheduledTask.timeoutId);
            this.scheduledTasks.delete(taskId);
            logger.info(`🗑️ Cancelled scheduled task: ${taskId}`);
            return true;
        } else {
            logger.warn(`⚠️ Task not found: ${taskId}`);
            return false;
        }
    }

    /**
     * List all scheduled tasks
     */
    listScheduledTasks() {
        const tasks = [];
        for (const [taskId, taskInfo] of this.scheduledTasks) {
            tasks.push({
                id: taskId,
                type: taskInfo.type,
                scheduleTime: taskInfo.scheduleTime,
                content: taskInfo.content || taskInfo.threadParts,
                status: 'scheduled'
            });
        }
        return tasks;
    }

    /**
     * Stop all scheduled tasks
     */
    stopAllTasks() {
        for (const [taskId, taskInfo] of this.scheduledTasks) {
            clearTimeout(taskInfo.timeoutId);
            logger.info(`🛑 Stopped task: ${taskId}`);
        }
        this.scheduledTasks.clear();
        logger.info('🛑 All scheduled tasks stopped');
    }

    /**
     * Quick scheduling shortcuts
     */
    quickSchedule = {
        // Schedule for 1 minute from now
        in1Minute: (content, taskId) => {
            const time = new Date();
            time.setMinutes(time.getMinutes() + 1);
            return this.scheduleThread(content, time, taskId);
        },

        // Schedule for 5 minutes from now
        in5Minutes: (content, taskId) => {
            const time = new Date();
            time.setMinutes(time.getMinutes() + 5);
            return this.scheduleThread(content, time, taskId);
        },

        // Schedule for 1 hour from now
        in1Hour: (content, taskId) => {
            const time = new Date();
            time.setHours(time.getHours() + 1);
            return this.scheduleThread(content, time, taskId);
        },

        // Schedule for tomorrow at 9 AM
        tomorrowMorning: (content, taskId) => {
            const time = new Date();
            time.setDate(time.getDate() + 1);
            time.setHours(9, 0, 0, 0);
            return this.scheduleThread(content, time, taskId);
        },

        // Schedule thread chain for 1 minute from now
        chainIn1Minute: (threadParts, taskId) => {
            const time = new Date();
            time.setMinutes(time.getMinutes() + 1);
            return this.scheduleThreadChain(threadParts, time, taskId);
        },

        // Schedule thread chain for 5 minutes from now
        chainIn5Minutes: (threadParts, taskId) => {
            const time = new Date();
            time.setMinutes(time.getMinutes() + 5);
            return this.scheduleThreadChain(threadParts, time, taskId);
        }
    };

    /**
     * Initialize bot login if needed
     */
    async initialize() {
        try {
            const bot = await this.getBotInstance();
            if (!bot.isLoggedIn) {
                await bot.ultimateLogin();
            }
            logger.info('✅ Scheduler bot ready');
        } catch (error) {
            logger.error('❌ Failed to initialize scheduler bot:', error);
            throw error;
        }
    }

    /**
     * Gracefully shutdown the scheduler
     */
    async shutdown() {
        this.stopAllTasks();
        if (this.bot && this.ownBot) {
            await this.bot.close();
        }
        logger.info('👋 Scheduler shutdown complete');
    }
}

module.exports = SimpleScheduler;
