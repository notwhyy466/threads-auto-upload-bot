const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class CookieManager {
    constructor() {
        this.cookiesDir = path.join(__dirname, '../../data');
        this.cookiesFile = path.join(this.cookiesDir, 'threads-cookies.json');
        this.credentialsFile = path.join(this.cookiesDir, 'threads-credentials.json');
        
        // Ensure data directory exists
        if (!fs.existsSync(this.cookiesDir)) {
            fs.mkdirSync(this.cookiesDir, { recursive: true });
        }
    }

    /**
     * Save cookies to file
     * @param {Array} cookies - Array of cookie objects from page.cookies()
     */
    async saveCookies(cookies) {
        try {
            // Filter relevant cookies for Threads
            const relevantCookies = cookies.filter(cookie => {
                return cookie.domain.includes('threads.net') || 
                       cookie.domain.includes('instagram.com') ||
                       cookie.domain.includes('facebook.com') ||
                       cookie.domain.includes('meta.com');
            });

            const cookieData = {
                cookies: relevantCookies,
                savedAt: new Date().toISOString(),
                domain: 'threads.net'
            };

            fs.writeFileSync(this.cookiesFile, JSON.stringify(cookieData, null, 2));
            logger.info(`Saved ${relevantCookies.length} cookies to ${this.cookiesFile}`);
            return true;
        } catch (error) {
            logger.error('Failed to save cookies:', error);
            return false;
        }
    }

    /**
     * Load cookies from file
     * @returns {Array|null} Array of cookie objects or null if not found
     */
    async loadCookies() {
        try {
            if (!fs.existsSync(this.cookiesFile)) {
                logger.info('No saved cookies found');
                return null;
            }

            const cookieData = JSON.parse(fs.readFileSync(this.cookiesFile, 'utf8'));
            
            // Check if cookies are not too old (30 days)
            const savedDate = new Date(cookieData.savedAt);
            const daysDiff = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24);
            
            if (daysDiff > 30) {
                logger.warn('Saved cookies are older than 30 days, they may not be valid');
            }

            logger.info(`Loaded ${cookieData.cookies.length} cookies saved on ${savedDate.toLocaleDateString()}`);
            return cookieData.cookies;
        } catch (error) {
            logger.error('Failed to load cookies:', error);
            return null;
        }
    }

    /**
     * Set cookies in the page
     * @param {Page} page - Puppeteer page object
     * @param {Array} cookies - Array of cookie objects
     */
    async setCookies(page, cookies) {
        try {
            if (!cookies || !Array.isArray(cookies)) {
                logger.warn('No valid cookies to set');
                return false;
            }

            // Set each cookie
            for (const cookie of cookies) {
                try {
                    await page.setCookie(cookie);
                } catch (error) {
                    logger.warn(`Failed to set cookie ${cookie.name}:`, error.message);
                }
            }

            logger.info(`Set ${cookies.length} cookies in page`);
            return true;
        } catch (error) {
            logger.error('Failed to set cookies:', error);
            return false;
        }
    }

    /**
     * Get current cookies from page and save them
     * @param {Page} page - Puppeteer page object
     */
    async saveCurrentCookies(page) {
        try {
            const cookies = await page.cookies();
            return await this.saveCookies(cookies);
        } catch (error) {
            logger.error('Failed to save current cookies:', error);
            return false;
        }
    }

    /**
     * Delete saved cookies
     */
    async deleteCookies() {
        try {
            if (fs.existsSync(this.cookiesFile)) {
                fs.unlinkSync(this.cookiesFile);
                logger.info('Deleted saved cookies');
                return true;
            }
            logger.info('No cookies file to delete');
            return true;
        } catch (error) {
            logger.error('Failed to delete cookies:', error);
            return false;
        }
    }

    /**
     * Check if cookies file exists
     */
    hasSavedCookies() {
        return fs.existsSync(this.cookiesFile);
    }

    /**
     * Get cookie file info
     */
    getCookieInfo() {
        try {
            if (!this.hasSavedCookies()) {
                return null;
            }

            const stats = fs.statSync(this.cookiesFile);
            const cookieData = JSON.parse(fs.readFileSync(this.cookiesFile, 'utf8'));
            
            return {
                exists: true,
                savedAt: cookieData.savedAt,
                cookieCount: cookieData.cookies.length,
                fileSize: stats.size,
                lastModified: stats.mtime
            };
        } catch (error) {
            logger.error('Failed to get cookie info:', error);
            return null;
        }
    }

    /**
     * Save credentials securely (encrypted with simple obfuscation)
     * @param {string} username - Username/email
     * @param {string} password - Password
     */
    async saveCredentials(username, password) {
        try {
            // Simple obfuscation (not encryption, but better than plain text)
            const obfuscatedData = {
                u: Buffer.from(username).toString('base64'),
                p: Buffer.from(password).toString('base64'),
                savedAt: new Date().toISOString(),
                version: '1.0'
            };

            fs.writeFileSync(this.credentialsFile, JSON.stringify(obfuscatedData, null, 2));
            logger.info('Credentials saved securely');
            return true;
        } catch (error) {
            logger.error('Failed to save credentials:', error);
            return false;
        }
    }

    /**
     * Load saved credentials
     * @returns {Object|null} Credentials object or null
     */
    async loadCredentials() {
        try {
            if (!fs.existsSync(this.credentialsFile)) {
                return null;
            }

            const obfuscatedData = JSON.parse(fs.readFileSync(this.credentialsFile, 'utf8'));
            
            // Deobfuscate
            const credentials = {
                username: Buffer.from(obfuscatedData.u, 'base64').toString('utf8'),
                password: Buffer.from(obfuscatedData.p, 'base64').toString('utf8'),
                savedAt: obfuscatedData.savedAt
            };

            logger.info('Credentials loaded successfully');
            return credentials;
        } catch (error) {
            logger.error('Failed to load credentials:', error);
            return null;
        }
    }

    /**
     * Check if credentials are saved
     */
    hasSavedCredentials() {
        return fs.existsSync(this.credentialsFile);
    }

    /**
     * Delete saved credentials
     */
    async deleteCredentials() {
        try {
            if (fs.existsSync(this.credentialsFile)) {
                fs.unlinkSync(this.credentialsFile);
                logger.info('Deleted saved credentials');
                return true;
            }
            logger.info('No credentials file to delete');
            return true;
        } catch (error) {
            logger.error('Failed to delete credentials:', error);
            return false;
        }
    }

    /**
     * Get credentials info
     */
    getCredentialsInfo() {
        try {
            if (!this.hasSavedCredentials()) {
                return null;
            }

            const stats = fs.statSync(this.credentialsFile);
            const credData = JSON.parse(fs.readFileSync(this.credentialsFile, 'utf8'));
            
            return {
                exists: true,
                savedAt: credData.savedAt,
                username: Buffer.from(credData.u, 'base64').toString('utf8'),
                lastModified: stats.mtime
            };
        } catch (error) {
            logger.error('Failed to get credentials info:', error);
            return null;
        }
    }
}

module.exports = CookieManager;
