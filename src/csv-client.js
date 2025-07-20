const CSVReader = require('./utils/csv-reader');
const logger = require('./utils/logger');

class CSVClient {
  constructor() {
    this.csvReader = new CSVReader();
    this.currentCSVFile = null;
    this.currentThreads = [];
  }

  /**
   * Set current CSV file to use
   */
  setCurrentCSV(filename) {
    this.currentCSVFile = filename;
    logger.info(`Set current CSV file: ${filename}`);
  }

  /**
   * Get available CSV files
   */
  getAvailableFiles() {
    return this.csvReader.getAvailableCSVFiles();
  }

  /**
   * Load threads from specified CSV file
   */
  async loadThreadsFromCSV(filename) {
    try {
      const threads = this.csvReader.readCSV(filename);
      this.currentThreads = threads;
      this.currentCSVFile = filename;
      return threads;
    } catch (error) {
      logger.error('Error loading threads from CSV:', error);
      throw error;
    }
  }

  /**
   * Get thread data (from current loaded CSV or load from file)
   */
  async getThreadData(filename = null) {
    try {
      // If filename specified, load from that file
      if (filename) {
        return await this.loadThreadsFromCSV(filename);
      }

      // If we have current threads loaded, return them
      if (this.currentThreads.length > 0) {
        return this.currentThreads;
      }

      // If no current file set, return empty array
      if (!this.currentCSVFile) {
        logger.warn('No CSV file selected. Use loadThreadsFromCSV() first.');
        return [];
      }

      // Load from current file
      return await this.loadThreadsFromCSV(this.currentCSVFile);

    } catch (error) {
      logger.error('Error getting thread data:', error);
      return [];
    }
  }

  /**
   * Create sample CSV file
   */
  createSampleFile() {
    return this.csvReader.createSampleCSV();
  }

  /**
   * Get scheduled threads (threads with scheduledTime set)
   */
  async getScheduledThreads() {
    try {
      const allThreads = await this.getThreadData();
      return allThreads.filter(thread => 
        thread.scheduledTime && 
        thread.scheduledTime.trim() && 
        thread.scheduledTime !== 'Not scheduled'
      );
    } catch (error) {
      logger.error('Error getting scheduled threads:', error);
      return [];
    }
  }

  /**
   * Test connection (always true for CSV)
   */
  async testConnection() {
    return await this.csvReader.testConnection();
  }

  /**
   * Get info about current CSV
   */
  getCurrentCSVInfo() {
    return {
      filename: this.currentCSVFile,
      threadsCount: this.currentThreads.length,
      lastLoaded: new Date().toISOString()
    };
  }

  /**
   * Clear current data
   */
  clear() {
    this.currentCSVFile = null;
    this.currentThreads = [];
    logger.info('Cleared current CSV data');
  }
}

module.exports = CSVClient;
