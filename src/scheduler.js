const cron = require('node-cron');
const config = require('../config/config');
const logger = require('./utils/logger');
const { sleep, formatTime, parseTimeToDate } = require('./utils/delay');
const ThreadsBot = require('./threads-bot');
const SheetsClient = require('./sheets-client');
const CSVClient = require('./csv-client');

class Scheduler {
  constructor() {
    this.threadsBot = new ThreadsBot();
    this.sheetsClient = new SheetsClient();
    this.csvClient = new CSVClient();
    this.dataSource = 'csv'; // Default to CSV
    this.isRunning = false;
    this.cronJob = null;
    this.postedThreads = new Set(); // Track posted threads to avoid duplicates
  }

  /**
   * Set data source (csv or sheets)
   */
  setDataSource(source, csvFilename = null) {
    this.dataSource = source;
    if (source === 'csv' && csvFilename) {
      this.csvClient.setCurrentCSV(csvFilename);
    }
    logger.info(`Data source set to: ${source}`);
  }

  /**
   * Get current data client based on source
   */
  getCurrentDataClient() {
    return this.dataSource === 'csv' ? this.csvClient : this.sheetsClient;
  }

  /**
   * Initialize scheduler
   */
  async initialize() {
    try {
      logger.info('Initializing scheduler...');
      
      // Initialize Threads bot
      await this.threadsBot.initialize();
      
      // Check if logged in, if not wait for manual login
      if (!this.threadsBot.isLoggedIn) {
        await this.threadsBot.waitForManualLogin();
      }
      
      // Initialize data client based on source
      if (this.dataSource === 'sheets') {
        await this.sheetsClient.initialize();
      } else {
        // CSV client doesn't need initialization
        logger.info('Using CSV data source');
      }
      
      logger.success('Scheduler initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize scheduler:', error);
      throw error;
    }
  }

  /**
   * Start the scheduler - checks every minute for scheduled threads
   */
  start() {
    try {
      if (this.isRunning) {
        logger.warn('Scheduler is already running');
        return;
      }

      logger.info('Starting scheduler...');
      
      // Run every minute at second 0
      this.cronJob = cron.schedule('0 * * * * *', async () => {
        await this.checkAndPostScheduledThreads();
      }, {
        scheduled: false
      });

      this.cronJob.start();
      this.isRunning = true;
      
      logger.success('Scheduler started - checking for scheduled threads every minute');
    } catch (error) {
      logger.error('Failed to start scheduler:', error);
      throw error;
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    try {
      if (!this.isRunning) {
        logger.warn('Scheduler is not running');
        return;
      }

      if (this.cronJob) {
        this.cronJob.stop();
        this.cronJob = null;
      }

      this.isRunning = false;
      logger.info('Scheduler stopped');
    } catch (error) {
      logger.error('Failed to stop scheduler:', error);
    }
  }

  /**
   * Check for scheduled threads and post them
   */
  async checkAndPostScheduledThreads() {
    try {
      if (!this.isRunning) return;

      const now = new Date();
      const currentTime = formatTime(now);
      
      logger.debug(`Checking for scheduled threads at ${currentTime}`);

      // Get scheduled threads from data source
      const scheduledThreads = await this.getCurrentDataClient().getScheduledThreads();
      
      if (scheduledThreads.length === 0) {
        return; // No threads to post
      }

      for (const thread of scheduledThreads) {
        try {
          // Create unique thread ID to avoid duplicates
          const threadId = `${thread.id}_${thread.scheduledTime}`;
          
          if (this.postedThreads.has(threadId)) {
            logger.debug(`Thread ${thread.id} already posted today, skipping`);
            continue;
          }

          logger.info(`Posting scheduled thread: "${thread.title}"`);
          
          // Post the thread
          await this.threadsBot.postThreadChain(thread.tweets, thread.title);
          
          // Mark as posted
          this.postedThreads.add(threadId);
          
          logger.success(`Thread "${thread.title}" posted successfully at ${currentTime}`);
          
          // Wait between threads if multiple threads are scheduled
          if (scheduledThreads.length > 1) {
            logger.info(`Waiting ${config.timing.delayBetweenThreads / 1000} seconds before next thread...`);
            await sleep(config.timing.delayBetweenThreads);
          }
          
        } catch (error) {
          logger.error(`Failed to post thread "${thread.title}":`, error);
          // Continue with next thread instead of stopping
        }
      }
      
    } catch (error) {
      logger.error('Error checking scheduled threads:', error);
    }
  }

  /**
   * Post a specific thread immediately (manual posting)
   * @param {number} threadId - ID of thread to post
   */
  async postThreadNow(threadId) {
    try {
      logger.info(`Manual posting of thread ${threadId}...`);
      
      // Ensure Threads bot is initialized and logged in
      if (!this.threadsBot.browser) {
        await this.threadsBot.initialize();
      }
      
      if (!this.threadsBot.isLoggedIn) {
        logger.warn('Not logged in to Threads. Initiating login process...');
        await this.threadsBot.waitForManualLogin();
      }
      
      const allThreads = await this.getCurrentDataClient().getThreadData();
      const thread = allThreads.find(t => t.id === threadId);
      
      if (!thread) {
        throw new Error(`Thread ${threadId} not found`);
      }

      await this.threadsBot.postThreadChain(thread.tweets, thread.title);
      
      logger.success(`Thread "${thread.title}" posted manually`);
      return true;
    } catch (error) {
      logger.error(`Failed to post thread ${threadId} manually:`, error);
      throw error;
    }
  }

  /**
   * Get status of scheduler and upcoming threads
   */
  async getStatus() {
    try {
      const allThreads = await this.getCurrentDataClient().getThreadData();
      const scheduledThreads = allThreads.filter(t => t.scheduledTime && t.scheduledTime.trim());
      
      const status = {
        isRunning: this.isRunning,
        isLoggedIn: this.threadsBot.isLoggedIn,
        totalThreads: allThreads.length,
        scheduledThreads: scheduledThreads.length,
        postedToday: this.postedThreads.size,
        upcomingThreads: scheduledThreads.map(t => ({
          id: t.id,
          title: t.title,
          scheduledTime: t.scheduledTime,
          tweetCount: t.tweets.length
        }))
      };

      return status;
    } catch (error) {
      logger.error('Failed to get scheduler status:', error);
      return {
        isRunning: this.isRunning,
        isLoggedIn: false,
        error: error.message
      };
    }
  }

  /**
   * Reset posted threads counter (useful for testing or daily reset)
   */
  resetPostedThreads() {
    this.postedThreads.clear();
    logger.info('Posted threads counter reset');
  }

  /**
   * Test all components
   */
  async test() {
    try {
      logger.info('Testing scheduler components...');
      
      // Test data connection based on current source
      const dataConnected = await this.getCurrentDataClient().testConnection();
      if (!dataConnected) {
        throw new Error(`${this.dataSource.toUpperCase()} connection failed`);
      }
      logger.info(`${this.dataSource.toUpperCase()} connection: ✅ OK`);

      // Test Threads bot
      const threadsConnected = await this.threadsBot.test();
      if (!threadsConnected) {
        throw new Error('Threads bot connection failed');
      }
      logger.info('Threads bot connection: ✅ OK');

      logger.success('All scheduler components tested successfully');
      return true;
    } catch (error) {
      logger.error('Scheduler test failed:', error);
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      this.stop();
      await this.threadsBot.close();
      logger.info('Scheduler cleanup completed');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

module.exports = Scheduler;
