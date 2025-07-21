/**
 * Manual Cookie Setup Utility for RDP Environment
 * Handles adding sessionid and other authentication cookies manually
 */

const fs = require('fs');
const path = require('path');
const logger = require('./src/utils/logger');

class ManualCookieSetup {
    constructor() {
        this.cookiesFile = path.join(__dirname, 'data/threads-cookies.json');
        this.dataDir = path.join(__dirname, 'data');
        
        // Ensure data directory exists
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    /**
     * Add sessionid cookie manually for authentication
     * @param {string} sessionId - The sessionid value from Instagram/Threads
     */
    async addSessionCookie(sessionId) {
        try {
            logger.info('Adding manual sessionid cookie...');
            
            // Create cookie objects for different domains
            const cookies = [
                {
                    name: 'sessionid',
                    value: sessionId,
                    domain: '.threads.net',
                    path: '/',
                    httpOnly: true,
                    secure: true,
                    sameSite: 'None'
                },
                {
                    name: 'sessionid',
                    value: sessionId,
                    domain: '.instagram.com',
                    path: '/',
                    httpOnly: true,
                    secure: true,
                    sameSite: 'None'
                },
                {
                    name: 'sessionid',
                    value: sessionId,
                    domain: '.facebook.com',
                    path: '/',
                    httpOnly: true,
                    secure: true,
                    sameSite: 'None'
                }
            ];

            // Load existing cookies if any
            let existingData = { cookies: [] };
            if (fs.existsSync(this.cookiesFile)) {
                existingData = JSON.parse(fs.readFileSync(this.cookiesFile, 'utf8'));
            }

            // Remove any existing sessionid cookies
            existingData.cookies = existingData.cookies.filter(c => c.name !== 'sessionid');
            
            // Add new sessionid cookies
            existingData.cookies.push(...cookies);
            
            // Update metadata
            existingData.savedAt = new Date().toISOString();
            existingData.domain = 'threads.net';
            existingData.manuallyAdded = true;

            // Save to file
            fs.writeFileSync(this.cookiesFile, JSON.stringify(existingData, null, 2));
            
            logger.info(`Successfully added sessionid cookie for multiple domains`);
            logger.info(`Cookie file updated: ${this.cookiesFile}`);
            
            return true;
        } catch (error) {
            logger.error('Failed to add sessionid cookie:', error);
            return false;
        }
    }

    /**
     * Add additional authentication cookies for better RDP compatibility
     */
    async addRDPOptimizedCookies(sessionId, additionalCookies = {}) {
        try {
            logger.info('Adding RDP-optimized cookies...');
            
            const defaultCookies = [
                // Session cookies
                {
                    name: 'sessionid',
                    value: sessionId,
                    domain: '.threads.net',
                    path: '/',
                    httpOnly: true,
                    secure: true,
                    sameSite: 'None'
                },
                {
                    name: 'sessionid',
                    value: sessionId,
                    domain: '.instagram.com',
                    path: '/',
                    httpOnly: true,
                    secure: true,
                    sameSite: 'None'
                },
                // CSRF token (if provided)
                ...(additionalCookies.csrftoken ? [{
                    name: 'csrftoken',
                    value: additionalCookies.csrftoken,
                    domain: '.threads.net',
                    path: '/',
                    secure: true,
                    sameSite: 'Lax'
                }] : []),
                // User ID (if provided)
                ...(additionalCookies.ds_user_id ? [{
                    name: 'ds_user_id',
                    value: additionalCookies.ds_user_id,
                    domain: '.threads.net',
                    path: '/',
                    secure: true,
                    sameSite: 'Lax'
                }] : []),
                // Additional stability cookies for RDP
                {
                    name: 'datr',
                    value: additionalCookies.datr || this.generateRandomToken(24),
                    domain: '.threads.net',
                    path: '/',
                    secure: true,
                    sameSite: 'None'
                }
            ];

            const cookieData = {
                cookies: defaultCookies,
                savedAt: new Date().toISOString(),
                domain: 'threads.net',
                manuallyAdded: true,
                rdpOptimized: true
            };

            fs.writeFileSync(this.cookiesFile, JSON.stringify(cookieData, null, 2));
            
            logger.info(`Added ${defaultCookies.length} RDP-optimized cookies`);
            return true;
            
        } catch (error) {
            logger.error('Failed to add RDP-optimized cookies:', error);
            return false;
        }
    }

    /**
     * Generate random token for cookies
     */
    generateRandomToken(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Show current cookies status
     */
    showCookiesStatus() {
        try {
            if (!fs.existsSync(this.cookiesFile)) {
                console.log('❌ No cookies file found');
                return false;
            }

            const data = JSON.parse(fs.readFileSync(this.cookiesFile, 'utf8'));
            console.log('\n🍪 Current Cookies Status:');
            console.log(`📅 Saved: ${new Date(data.savedAt).toLocaleString()}`);
            console.log(`🔢 Total cookies: ${data.cookies.length}`);
            console.log(`✅ Manually added: ${data.manuallyAdded ? 'Yes' : 'No'}`);
            console.log(`🖥️  RDP optimized: ${data.rdpOptimized ? 'Yes' : 'No'}`);
            
            const sessionCookies = data.cookies.filter(c => c.name === 'sessionid');
            console.log(`🔑 Session cookies: ${sessionCookies.length}`);
            
            if (sessionCookies.length > 0) {
                console.log('📝 Session cookie domains:');
                sessionCookies.forEach(cookie => {
                    console.log(`   - ${cookie.domain}`);
                });
            }
            
            return true;
        } catch (error) {
            console.log('❌ Error reading cookies:', error.message);
            return false;
        }
    }
}

// CLI usage
if (require.main === module) {
    const setup = new ManualCookieSetup();
    
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (command === 'add-session') {
        const sessionId = args[1];
        if (!sessionId) {
            console.log('❌ Usage: node manual-cookie-setup.js add-session <sessionid_value>');
            console.log('Example: node manual-cookie-setup.js add-session "75997129266%xzkkA5rT32ilk5:24:AYeqTr4eacm-wvy5Yd5DGan4y3ely1NOxI0ZkEU3PQ"');
            process.exit(1);
        }
        
        setup.addSessionCookie(sessionId).then(success => {
            if (success) {
                console.log('✅ Session cookie added successfully!');
                setup.showCookiesStatus();
            } else {
                console.log('❌ Failed to add session cookie');
                process.exit(1);
            }
        });
    } else if (command === 'status') {
        setup.showCookiesStatus();
    } else {
        console.log(`
🍪 Manual Cookie Setup for RDP Environment

Usage:
  node manual-cookie-setup.js add-session <sessionid>  Add sessionid cookie
  node manual-cookie-setup.js status                   Show current cookies status

Examples:
  node manual-cookie-setup.js add-session "75997129266%xzkkA5rT32ilk5:24:AYeqTr4eacm-wvy5Yd5DGan4y3ely1NOxI0ZkEU3PQ"
  node manual-cookie-setup.js status
        `);
    }
}

module.exports = ManualCookieSetup;
