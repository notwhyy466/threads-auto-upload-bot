const fs = require('fs');
const path = require('path');
const config = require('../../config/config');

class Logger {
  constructor() {
    this.logLevel = config.logging.level;
    this.logFile = config.logging.file;
    this.ensureLogDir();
  }

  ensureLogDir() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(data && { data })
    };
    return JSON.stringify(logEntry);
  }

  writeToFile(message) {
    try {
      fs.appendFileSync(this.logFile, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  log(level, message, data = null) {
    const formattedMessage = this.formatMessage(level, message, data);
    
    // Console output
    const consoleMessage = `[${new Date().toISOString()}] ${level.toUpperCase()}: ${message}`;
    
    switch (level) {
      case 'error':
        console.error(consoleMessage, data || '');
        break;
      case 'warn':
        console.warn(consoleMessage, data || '');
        break;
      case 'info':
        console.info(consoleMessage, data || '');
        break;
      case 'debug':
        console.debug(consoleMessage, data || '');
        break;
      default:
        console.log(consoleMessage, data || '');
    }

    // File output
    this.writeToFile(formattedMessage);
  }

  info(message, data = null) {
    this.log('info', message, data);
  }

  warn(message, data = null) {
    this.log('warn', message, data);
  }

  error(message, data = null) {
    this.log('error', message, data);
  }

  debug(message, data = null) {
    if (this.logLevel === 'debug') {
      this.log('debug', message, data);
    }
  }

  success(message, data = null) {
    this.log('info', `✓ ${message}`, data);
  }
}

module.exports = new Logger();
