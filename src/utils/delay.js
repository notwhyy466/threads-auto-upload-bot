/**
 * Utility functions for timing and delays
 */

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get random delay between min and max milliseconds
 * @param {number} min - Minimum milliseconds
 * @param {number} max - Maximum milliseconds
 * @returns {number}
 */
function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sleep with random delay
 * @param {number} min - Minimum milliseconds
 * @param {number} max - Maximum milliseconds
 * @returns {Promise}
 */
async function randomSleep(min, max) {
  const delay = getRandomDelay(min, max);
  return sleep(delay);
}

/**
 * Human-like typing delay
 * @param {string} text - Text to calculate typing delay for
 * @returns {number} - Delay in milliseconds
 */
function getTypingDelay(text) {
  // Average typing speed: 40 WPM (words per minute)
  // 1 word = 5 characters on average
  // 40 words * 5 chars = 200 characters per minute
  // 200 chars / 60 seconds = 3.33 chars per second
  // 1000ms / 3.33 = 300ms per character (slow typing)
  
  const baseDelayPerChar = 100; // Base delay per character
  const randomFactor = 0.5; // Add some randomness
  
  return text.length * baseDelayPerChar * (1 + Math.random() * randomFactor);
}

/**
 * Wait for a condition to be true
 * @param {Function} condition - Function that returns true when condition is met
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @param {number} interval - Check interval in milliseconds
 * @returns {Promise<boolean>}
 */
async function waitForCondition(condition, timeout = 30000, interval = 1000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await sleep(interval);
  }
  
  return false;
}

/**
 * Format time for display
 * @param {Date} date - Date object
 * @returns {string}
 */
function formatTime(date) {
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Parse time string (HH:MM format) to Date object for today
 * @param {string} timeString - Time in HH:MM format
 * @returns {Date}
 */
function parseTimeToDate(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  
  // If the time has already passed today, schedule for tomorrow
  if (date < new Date()) {
    date.setDate(date.getDate() + 1);
  }
  
  return date;
}

module.exports = {
  sleep,
  getRandomDelay,
  randomSleep,
  getTypingDelay,
  waitForCondition,
  formatTime,
  parseTimeToDate
};
