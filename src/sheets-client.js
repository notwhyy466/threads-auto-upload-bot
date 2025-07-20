const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const config = require('../config/config');
const logger = require('./utils/logger');

// Sample threads data (fallback when Google Sheets is not available)
const sampleThreads = [
  {
    id: 1,
    title: "Welcome Thread",
    tweets: [
      "🚀 Welcome to our automated posting system! This is the first post in a thread.",
      "📋 You can create multiple posts that will be connected as a thread.",
      "✨ Perfect for sharing longer content or stories!"
    ],
    scheduledTime: "09:00"
  },
  {
    id: 2,
    title: "Tips for Success",
    tweets: [
      "💡 Here are some tips for creating engaging content...",
      "1️⃣ Keep your audience engaged with questions",
      "2️⃣ Use emojis to make your content more visual",
      "3️⃣ Post consistently to build your following"
    ],
    scheduledTime: "14:30"
  },
  {
    id: 3,
    title: "Single Post Example",
    tweets: [
      "📝 This is an example of a single post (not a thread). Sometimes one post is all you need to share your message!"
    ],
    scheduledTime: "18:00"
  }
];

class SheetsClient {
  constructor() {
    this.doc = null;
    this.sheet = null;
    this.isAuthenticated = false;
    this.useSampleData = false;
  }

  /**
   * Initialize and authenticate with Google Sheets
   */
  async initialize() {
    try {
      logger.info('Initializing Google Sheets client...');
      
      let serviceAccountAuth;
      
      // Method 1: Try JSON file first (recommended)
      if (config.googleSheets.jsonPath) {
        try {
          const fs = require('fs');
          const path = require('path');
          const jsonPath = path.resolve(config.googleSheets.jsonPath);
          
          if (fs.existsSync(jsonPath)) {
            logger.info('Using Google Service Account JSON file');
            const serviceAccountKey = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            
            serviceAccountAuth = new JWT({
              email: serviceAccountKey.client_email,
              key: serviceAccountKey.private_key,
              scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
            });
          } else {
            logger.warn(`JSON file not found at: ${jsonPath}`);
          }
        } catch (jsonError) {
          logger.warn('Failed to load JSON file, trying environment variables:', jsonError.message);
        }
      }
      
      // Method 2: Use environment variables if JSON file not available
      if (!serviceAccountAuth) {
        if (!config.googleSheets.serviceAccount.email || !config.googleSheets.serviceAccount.privateKey) {
          throw new Error('Google Sheets credentials not found. Please check your .env file or provide a JSON file.');
        }
        
        if (config.googleSheets.serviceAccount.privateKey === 'your-private-key-here') {
          throw new Error('Please update your Google Sheets credentials in .env file');
        }

        logger.info('Using Google Service Account from environment variables');
        serviceAccountAuth = new JWT({
          email: config.googleSheets.serviceAccount.email,
          key: config.googleSheets.serviceAccount.privateKey,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
      }

      // Initialize Google Spreadsheet
      this.doc = new GoogleSpreadsheet(config.googleSheets.spreadsheetId, serviceAccountAuth);
      
      // Load document info
      await this.doc.loadInfo();
      logger.success(`Connected to spreadsheet: ${this.doc.title}`);
      
      // Get the first sheet
      this.sheet = this.doc.sheetsByIndex[0];
      logger.info(`Using sheet: ${this.sheet.title}`);
      
      this.isAuthenticated = true;
      return true;
    } catch (error) {
      logger.error('Failed to initialize Google Sheets client:', error);
      
      // Fallback to sample data for testing
      logger.warn('Falling back to sample data for testing purposes');
      logger.warn('Please setup Google Sheets API credentials to use real data');
      this.useSampleData = true;
      this.isAuthenticated = false;
      return false;
    }
  }

  /**
   * Get all thread data from the spreadsheet
   * @returns {Array} Array of thread objects
   */
  async getThreadData() {
    try {
      // Use sample data if Google Sheets is not available
      if (this.useSampleData) {
        logger.info('Using sample thread data (Google Sheets not configured)');
        return sampleThreads;
      }
      
      if (!this.isAuthenticated) {
        await this.initialize();
      }

      // If still not authenticated after initialization, use sample data
      if (!this.isAuthenticated) {
        logger.warn('Google Sheets not available, using sample data');
        return sampleThreads;
      }

      logger.info('Fetching thread data from Google Sheets...');
      
      // Load all rows
      const rows = await this.sheet.getRows();
      
      if (!rows || rows.length === 0) {
        logger.warn('No data found in the spreadsheet');
        return [];
      }

      const threads = [];
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Skip empty rows
        if (!row.get('A') && !row.get('B')) {
          continue;
        }

        const thread = {
          id: i + 1,
          title: row.get('A') || '', // Kolom A - Judul
          tweets: [], // Array untuk menyimpan semua tweet dalam thread
          scheduledTime: row.get('E') || '', // Kolom E - Time
          status: 'pending'
        };

        // Tambahkan judul sebagai tweet pertama jika ada
        if (thread.title.trim()) {
          thread.tweets.push(thread.title.trim());
        }

        // Tambahkan utasan dari kolom B, C, D
        const threadTweets = [
          row.get('B'), // Kolom B - Utasan 1
          row.get('C'), // Kolom C - Utasan 2
          row.get('D')  // Kolom D - Utasan 3
        ];

        // Filter dan tambahkan tweet yang tidak kosong
        threadTweets.forEach(tweet => {
          if (tweet && tweet.trim()) {
            thread.tweets.push(tweet.trim());
          }
        });

        // Skip thread jika tidak ada tweet sama sekali
        if (thread.tweets.length === 0) {
          continue;
        }

        threads.push(thread);
        logger.debug(`Loaded thread ${thread.id}:`, {
          title: thread.title,
          tweetCount: thread.tweets.length,
          scheduledTime: thread.scheduledTime
        });
      }

      logger.success(`Loaded ${threads.length} threads from spreadsheet`);
      return threads;
    } catch (error) {
      logger.error('Failed to get thread data:', error);
      logger.warn('Falling back to sample data due to error');
      return sampleThreads;
    }
  }

  /**
   * Get threads that are scheduled for posting
   * @returns {Array} Array of threads ready to be posted
   */
  async getScheduledThreads() {
    try {
      const allThreads = await this.getThreadData();
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      
      const scheduledThreads = allThreads.filter(thread => {
        if (!thread.scheduledTime) return false;
        
        // Parse scheduled time
        const scheduledTime = thread.scheduledTime.trim();
        if (!scheduledTime.match(/^\d{1,2}:\d{2}$/)) {
          logger.warn(`Invalid time format for thread ${thread.id}: ${scheduledTime}`);
          return false;
        }
        
        return scheduledTime === currentTime && thread.status === 'pending';
      });

      if (scheduledThreads.length > 0) {
        logger.info(`Found ${scheduledThreads.length} threads scheduled for ${currentTime}`);
      }
      
      return scheduledThreads;
    } catch (error) {
      logger.error('Failed to get scheduled threads:', error);
      return [];
    }
  }

  /**
   * Test connection to Google Sheets
   */
  async testConnection() {
    try {
      const initResult = await this.initialize();
      
      if (!initResult) {
        logger.info('Google Sheets not configured, but sample data is available');
        logger.info('📋 To use real Google Sheets data, please setup API credentials');
        logger.info('📖 See GOOGLE_SHEETS_SETUP.md for detailed instructions');
        return true; // Return true so app can continue with sample data
      }
      
      const threads = await this.getThreadData();
      logger.success('Google Sheets connection test successful');
      logger.info(`Found ${threads.length} threads in the spreadsheet`);
      return true;
    } catch (error) {
      logger.error('Google Sheets connection test failed:', error);
      logger.info('But sample data is available for testing');
      return true; // Return true so app can continue with sample data
    }
  }
}

module.exports = SheetsClient;
