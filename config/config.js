const path = require('path');

module.exports = {
  // Google Sheets Configuration
  googleSheets: {
    spreadsheetId: process.env.GOOGLE_SHEETS_ID || '1PMQK89W5YZzKzASDzOxaWMSN3exhp-gLyrtd9cM-t4Y',
    range: 'Sheet1!A:E', // A=Judul, B-D=Utasan, E=Time
    // Support both JSON file and direct credentials
    jsonPath: process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH,
    serviceAccount: {
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    }
  },

  // Browser Configuration
  browser: {
    headless: process.env.HEADLESS_MODE === 'true',
    userDataDir: path.join(__dirname, '..', process.env.USER_DATA_DIR || './data/chrome-profile'),
    viewport: {
      width: parseInt(process.env.VIEWPORT_WIDTH) || 1366,
      height: parseInt(process.env.VIEWPORT_HEIGHT) || 768
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  },

  // Timing Configuration (in milliseconds)
  timing: {
    delayBetweenActions: parseInt(process.env.DELAY_BETWEEN_ACTIONS) || 2000,
    delayBetweenTweets: parseInt(process.env.DELAY_BETWEEN_TWEETS) || 30000, // 30 detik
    delayBetweenThreads: parseInt(process.env.DELAY_BETWEEN_THREADS) || 300000 // 5 menit
  },

  // Threads Configuration
  threads: {
    baseUrl: process.env.THREADS_BASE_URL || 'https://www.threads.net',
    loginUrl: process.env.THREADS_LOGIN_URL || 'https://www.threads.net/login',
    selectors: {
      // Login selectors
      usernameInput: 'input[name="username"]',
      passwordInput: 'input[name="password"]',
      loginButton: 'button[type="submit"]',
      
      // Post creation selectors
      newPostButton: '[aria-label="Create new post"]',
      postTextarea: '[role="textbox"][aria-label="Start a thread..."]',
      postButton: 'button[type="submit"]',
      addToThreadButton: '[aria-label="Add to thread"]',
      
      // Thread selectors
      threadReplyTextarea: '[role="textbox"][placeholder="Reply to thread..."]',
      replyButton: 'button[type="submit"]'
    }
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: path.join(__dirname, '..', 'logs', 'app.log')
  }
};
