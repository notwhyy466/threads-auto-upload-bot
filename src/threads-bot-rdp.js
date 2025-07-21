/**
 * Enhanced Threads Bot for RDP Environment
 * Handles manual cookies and better network stability
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');
const { sleep } = require('./utils/delay');

class ThreadsBotRDP {
    constructor() {
        this.browser = null;
        this.page = null;
        this.isLoggedIn = false;
        this.cookiesFile = path.join(__dirname, '../data/threads-cookies.json');
        this.config = {
            headless: false,
            defaultViewport: { width: 1366, height: 768 },
            userDataDir: path.join(__dirname, '../data/chrome-profile'),
            slowMo: 100, // Slower for RDP
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        };
        logger.info('ThreadsBotRDP instance created for RDP environment');
    }

    async init() {
        try {
            logger.info('Initializing browser for RDP environment...');
            
            this.browser = await puppeteer.launch({
                headless: this.config.headless,
                defaultViewport: this.config.defaultViewport,
                userDataDir: this.config.userDataDir,
                slowMo: this.config.slowMo,
                executablePath: this.config.executablePath,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-dev-shm-usage',
                    '--no-first-run',
                    '--no-default-browser-check',
                    '--disable-extensions-except=',
                    '--disable-plugins',
                    '--disable-images', // Speed up loading in RDP
                    '--disable-gpu',
                    '--remote-debugging-port=9222'
                ]
            });

            this.page = await this.browser.newPage();
            
            // Set realistic user agent
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
            
            // Remove automation detection
            await this.page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                });
                
                // Override plugins
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5],
                });
                
                // Override languages
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['en-US', 'en'],
                });
            });

            // Set extra headers for RDP compatibility
            await this.page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            });

            logger.info('Browser initialized successfully for RDP');
            return true;
        } catch (error) {
            logger.error('Failed to initialize browser:', error);
            throw error;
        }
    }

    /**
     * Load manual cookies before navigation
     */
    async loadManualCookies() {
        try {
            if (!fs.existsSync(this.cookiesFile)) {
                logger.warn('No manual cookies found. Please run: node manual-cookie-setup.js add-session <your_sessionid>');
                return false;
            }

            const cookieData = JSON.parse(fs.readFileSync(this.cookiesFile, 'utf8'));
            
            if (!cookieData.cookies || cookieData.cookies.length === 0) {
                logger.warn('No cookies in file');
                return false;
            }

            // Navigate to threads.net first to set domain
            await this.page.goto('https://www.threads.net/', { 
                waitUntil: 'domcontentloaded',
                timeout: 60000 // Longer timeout for RDP
            });

            // Set each cookie
            for (const cookie of cookieData.cookies) {
                try {
                    await this.page.setCookie(cookie);
                    logger.info(`Set cookie: ${cookie.name} for ${cookie.domain}`);
                } catch (error) {
                    logger.warn(`Failed to set cookie ${cookie.name}:`, error.message);
                }
            }

            logger.info(`Loaded ${cookieData.cookies.length} manual cookies`);
            return true;
        } catch (error) {
            logger.error('Failed to load manual cookies:', error);
            return false;
        }
    }

    /**
     * Enhanced login with manual cookies and RDP optimization
     */
    async login() {
        try {
            logger.info('Starting RDP-optimized login process...');
            
            if (!this.page) {
                await this.init();
            }

            // Load manual cookies first
            const cookiesLoaded = await this.loadManualCookies();
            
            if (cookiesLoaded) {
                // Reload page with cookies
                await this.page.reload({ waitUntil: 'networkidle0', timeout: 60000 });
                await sleep(5000);
            }

            // Check if already logged in
            const isAlreadyLoggedIn = await this.checkLoginStatus();
            if (isAlreadyLoggedIn) {
                logger.info('Already logged in via cookies!');
                this.isLoggedIn = true;
                return true;
            }

            // If not logged in, try alternative approaches
            logger.info('Not logged in, trying alternative login methods...');
            
            // Try navigating to Instagram first, then to Threads
            try {
                logger.info('Trying Instagram route...');
                await this.page.goto('https://www.instagram.com/', { 
                    waitUntil: 'networkidle0',
                    timeout: 60000 
                });
                await sleep(3000);
                
                // Then go to Threads
                await this.page.goto('https://www.threads.net/', { 
                    waitUntil: 'networkidle0',
                    timeout: 60000 
                });
                await sleep(5000);
                
                const loginCheck = await this.checkLoginStatus();
                if (loginCheck) {
                    logger.info('Login successful via Instagram route!');
                    this.isLoggedIn = true;
                    return true;
                }
            } catch (error) {
                logger.warn('Instagram route failed:', error.message);
            }

            // Manual login guidance
            logger.info('⚠️  Manual login required!');
            console.log(`
📋 Manual Login Instructions for RDP:

1. In the opened browser, manually log in to Threads
2. Complete any 2FA or verification steps
3. Once logged in, return to this terminal and press Enter
4. The bot will then save your session cookies automatically

⏳ Waiting for manual login... Press Enter when done.
            `);

            // Wait for user input
            await this.waitForUserInput();
            
            // Check login status after manual intervention
            const finalCheck = await this.checkLoginStatus();
            if (finalCheck) {
                // Save cookies after successful manual login
                await this.saveCurrentCookies();
                this.isLoggedIn = true;
                logger.info('✅ Manual login successful and cookies saved!');
                return true;
            } else {
                logger.error('❌ Login verification failed');
                return false;
            }

        } catch (error) {
            logger.error('Login process failed:', error);
            return false;
        }
    }

    /**
     * Check if user is logged in
     */
    async checkLoginStatus() {
        try {
            // Multiple selectors to check for login
            const loginIndicators = [
                'a[href="/compose"]',
                'button[aria-label="Create new thread"]',
                '[data-testid="primaryButton"]',
                'div[data-pressable-container="true"]'
            ];

            for (const selector of loginIndicators) {
                try {
                    const element = await this.page.$(selector);
                    if (element) {
                        logger.info(`Login confirmed with selector: ${selector}`);
                        return true;
                    }
                } catch (e) {
                    continue;
                }
            }

            // Check for profile elements
            const profileSelectors = [
                '[data-testid="primaryButton"]',
                'img[alt*="profile"]',
                'div[role="button"][tabindex="0"]'
            ];

            for (const selector of profileSelectors) {
                try {
                    const element = await this.page.$(selector);
                    if (element) {
                        logger.info(`Profile element found: ${selector}`);
                        return true;
                    }
                } catch (e) {
                    continue;
                }
            }

            return false;
        } catch (error) {
            logger.error('Error checking login status:', error);
            return false;
        }
    }

    /**
     * Save current cookies after successful login
     */
    async saveCurrentCookies() {
        try {
            const cookies = await this.page.cookies();
            const relevantCookies = cookies.filter(cookie => {
                return cookie.domain.includes('threads.net') || 
                       cookie.domain.includes('instagram.com') ||
                       cookie.domain.includes('facebook.com');
            });

            const cookieData = {
                cookies: relevantCookies,
                savedAt: new Date().toISOString(),
                domain: 'threads.net',
                rdpSession: true
            };

            fs.writeFileSync(this.cookiesFile, JSON.stringify(cookieData, null, 2));
            logger.info(`Saved ${relevantCookies.length} cookies from current session`);
            return true;
        } catch (error) {
            logger.error('Failed to save current cookies:', error);
            return false;
        }
    }

    /**
     * Wait for user input (for manual login)
     */
    async waitForUserInput() {
        return new Promise((resolve) => {
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            readline.question('', () => {
                readline.close();
                resolve();
            });
        });
    }

    /**
     * Post a thread with RDP optimizations
     */
    async postThread(content) {
        try {
            if (!this.isLoggedIn) {
                throw new Error('Not logged in. Please login first.');
            }

            logger.info('Starting thread posting process...');
            
            // Navigate to compose
            await this.page.goto('https://www.threads.net/compose', { 
                waitUntil: 'networkidle0',
                timeout: 60000 
            });
            
            await sleep(3000);

            // Find text area
            const textAreaSelectors = [
                'div[contenteditable="true"]',
                'textarea[placeholder*="thread"]',
                'div[data-testid="composer-text-view"]',
                '[role="textbox"]'
            ];

            let textArea = null;
            for (const selector of textAreaSelectors) {
                try {
                    textArea = await this.page.$(selector);
                    if (textArea) {
                        logger.info(`Found text area with selector: ${selector}`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!textArea) {
                throw new Error('Could not find text area for posting');
            }

            // Click and type content
            await textArea.click();
            await sleep(1000);
            await textArea.type(content, { delay: 50 });
            await sleep(2000);

            // Find and click post button
            const postButtonSelectors = [
                'button[type="submit"]',
                'div[role="button"][tabindex="0"]',
                'button:contains("Post")',
                '[data-testid="post-button"]'
            ];

            let postButton = null;
            for (const selector of postButtonSelectors) {
                try {
                    postButton = await this.page.$(selector);
                    if (postButton) {
                        const buttonText = await this.page.evaluate(el => el.textContent, postButton);
                        if (buttonText && buttonText.toLowerCase().includes('post')) {
                            logger.info(`Found post button: ${buttonText}`);
                            break;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }

            if (postButton) {
                await postButton.click();
                await sleep(5000);
                logger.info('Thread posted successfully!');
                return true;
            } else {
                throw new Error('Could not find post button');
            }

        } catch (error) {
            logger.error('Failed to post thread:', error);
            return false;
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            logger.info('Browser closed');
        }
    }
}

module.exports = ThreadsBotRDP;
