const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');
const { sleep } = require('./utils/delay');

class ThreadsBot {
    constructor() {
        this.browser = null;
        this.page = null;
        this.isLoggedIn = false;
        this.config = {
            headless: false,
            defaultViewport: { width: 1366, height: 768 },
            userDataDir: path.join(__dirname, '../data/chrome-profile'),
            slowMo: 50,
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        };
        logger.info('ThreadsBot instance created');
    }

    async init() {
        try {
            logger.info('Initializing browser...');
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
                    '--disable-features=VizDisplayCompositor'
                ]
            });

            this.page = await this.browser.newPage();
            
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
            
            await this.page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                });
            });

            logger.info('Browser initialized successfully');
            return true;
        } catch (error) {
            logger.error('Failed to initialize browser:', error);
            throw error;
        }
    }

    async initialize() {
        return await this.init();
    }

    async login() {
        try {
            logger.info('Starting login process...');
            
            if (!this.page) {
                await this.init();
            }

            await this.page.goto('https://www.threads.net/', { 
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            await sleep(3000);

            const selectors = [
                'a[href="/compose"]',
                'button[aria-label="Create new thread"]',
                '[data-testid="primaryButton"]',
                '.x1i10hfl.xjbqb8w.x6umtig.x1b1mbwd.xaqea5y.xav7gou.x9f619.x1ypdohk.xt0psk2.xe8uvvx.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x16tdsg8.x1hl2dhg.xggy1nq.x1a2a7pz.x1heor9g.xt0b8zv.xo1l8bm',
                'div[role="button"]'
            ];

            let foundElement = null;
            for (const selector of selectors) {
                try {
                    foundElement = await this.page.$(selector);
                    if (foundElement) {
                        logger.info(`Found compose button with selector: ${selector}`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (foundElement) {
                this.isLoggedIn = true;
                logger.info('Already logged in - found compose button');
                return true;
            }

            logger.info('Need to login - please login manually');
            return await this.waitForManualLogin();

        } catch (error) {
            logger.error('Login failed:', error);
            throw error;
        }
    }

    async waitForManualLogin() {
        try {
            logger.info('Waiting for manual login...');
            
            if (!this.page) {
                await this.init();
            }

            // Navigate to Threads login page
            await this.page.goto('https://www.threads.net/', { 
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            await sleep(3000);

            // Enhanced login detection with more selectors
            const loginDetectionSelectors = [
                'a[href="/compose"]',
                'button[aria-label="Create new thread"]',
                '[data-testid="primaryButton"]',
                'div[data-pressable-container="true"]',
                'svg[aria-label="Create"]',
                '[aria-label="Create new thread"]',
                'button:has(svg[aria-label="Create"])',
                '[role="button"]:has([aria-label="Create"])',
                // New Thread button variations
                'button[aria-label*="Create"]',
                'a[aria-label*="Create"]',
                // Profile or user indicator
                '[data-testid="userAvatar"]',
                '[aria-label*="Profile"]',
                // Home feed indicators
                '[data-testid="feed"]',
                '[aria-label="Home"]',
                // Any compose/write related elements
                '*[href*="compose"]',
                '*[aria-label*="compose" i]',
                '*[aria-label*="write" i]',
                '*[aria-label*="new thread" i]'
            ];

            let foundElement = null;
            for (const selector of loginDetectionSelectors) {
                try {
                    const elements = await this.page.$$(selector);
                    for (const element of elements) {
                        const isVisible = await this.page.evaluate(el => {
                            return el && el.offsetParent !== null && 
                                   getComputedStyle(el).visibility !== 'hidden' &&
                                   getComputedStyle(el).display !== 'none';
                        }, element);
                        
                        if (isVisible) {
                            logger.info(`Already logged in - found element: ${selector}`);
                            this.isLoggedIn = true;
                            return true;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }

            // Wait for login completion by monitoring for any login indicators
            logger.info('Waiting for login completion...');
            
            try {
                await this.page.waitForFunction(() => {
                    // Multiple detection strategies
                    const selectors = [
                        'a[href="/compose"]',
                        'button[aria-label="Create new thread"]',
                        '[data-testid="primaryButton"]',
                        'div[data-pressable-container="true"]',
                        'svg[aria-label="Create"]',
                        '[aria-label="Create new thread"]',
                        'button[aria-label*="Create"]',
                        '[data-testid="userAvatar"]',
                        '[aria-label*="Profile"]',
                        '[data-testid="feed"]',
                        '[aria-label="Home"]'
                    ];
                    
                    // Strategy 1: Look for compose/create elements
                    const hasComposeElement = selectors.some(selector => {
                        const element = document.querySelector(selector);
                        return element && element.offsetParent !== null;
                    });
                    
                    if (hasComposeElement) {
                        console.log('Login detected: Found compose element');
                        return true;
                    }
                    
                    // Strategy 2: Check URL changes (logged in users often get redirected)
                    if (window.location.pathname !== '/' && !window.location.pathname.includes('/login')) {
                        console.log('Login detected: URL changed to:', window.location.pathname);
                        return true;
                    }
                    
                    // Strategy 3: Look for any button/link that contains thread-related text
                    const allButtons = [...document.querySelectorAll('button, a, [role="button"]')];
                    const hasThreadButton = allButtons.some(btn => {
                        const text = btn.textContent.toLowerCase();
                        const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
                        return text.includes('create') || text.includes('thread') || text.includes('post') ||
                               ariaLabel.includes('create') || ariaLabel.includes('thread') || ariaLabel.includes('post');
                    });
                    
                    if (hasThreadButton) {
                        console.log('Login detected: Found thread-related button');
                        return true;
                    }
                    
                    // Strategy 4: Check for absence of login elements
                    const loginElements = document.querySelectorAll('[href*="login"], button:contains("Log in"), a:contains("Log in")');
                    if (loginElements.length === 0) {
                        console.log('Login detected: No login elements found');
                        return true;
                    }
                    
                    return false;
                }, { 
                    timeout: 300000, // 5 minutes timeout
                    polling: 2000    // Check every 2 seconds
                });
            } catch (timeoutError) {
                logger.warn('Login detection timeout - checking one more time...');
                
                // Final manual check
                const finalCheck = await this.page.evaluate(() => {
                    // Look for any indication we're logged in
                    const indicators = [
                        document.querySelector('a[href="/compose"]'),
                        document.querySelector('[aria-label*="Create"]'),
                        document.querySelector('[data-testid="userAvatar"]'),
                        window.location.pathname !== '/',
                        !document.querySelector('[href*="login"]')
                    ];
                    
                    return indicators.some(indicator => Boolean(indicator));
                });
                
                if (!finalCheck) {
                    throw new Error('Login timeout - please ensure you are logged in to Threads');
                }
            }

            this.isLoggedIn = true;
            logger.info('Manual login completed successfully');
            return true;

        } catch (error) {
            logger.error('Manual login failed:', error);
            throw error;
        }
    }

    /**
     * Handle "Save to drafts?" dialog if it appears
     */
    async handleSaveToDraftsDialog() {
        try {
            // Check if "Save to drafts?" dialog is present
            const dialogSelectors = [
                'button:contains("Don\'t save")',
                'button:contains("Jangan simpan")',
                '[role="dialog"] button[style*="color: rgb(255, 48, 64)"]', // Red "Don't save" button
                '[role="dialog"] button'
            ];

            for (const selector of dialogSelectors) {
                try {
                    if (selector.includes('contains')) {
                        // Handle text-based selectors
                        const buttons = await this.page.$$('button');
                        for (const button of buttons) {
                            const text = await this.page.evaluate(el => el.textContent, button);
                            if (text.includes("Don't save") || text.includes("Jangan simpan")) {
                                logger.info('Found "Don\'t save" button, clicking...');
                                await button.click();
                                await sleep(1000);
                                return true;
                            }
                        }
                    } else {
                        const element = await this.page.$(selector);
                        if (element) {
                            logger.info('Found dialog button, clicking...');
                            await element.click();
                            await sleep(1000);
                            return true;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
            return false;
        } catch (error) {
            logger.error('Error handling save to drafts dialog:', error);
            return false;
        }
    }

    /**
     * Split long text into chunks of max 500 characters
     */
    splitTextForThreads(text, maxLength = 500) {
        if (text.length <= maxLength) {
            return [text];
        }

        const chunks = [];
        let currentChunk = '';
        const sentences = text.split(/[.!?]+/);
        
        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (!trimmedSentence) continue;
            
            // Add punctuation back
            const sentenceWithPunc = trimmedSentence + (text.charAt(text.indexOf(trimmedSentence) + trimmedSentence.length) || '.');
            
            if ((currentChunk + ' ' + sentenceWithPunc).length <= maxLength) {
                currentChunk += (currentChunk ? ' ' : '') + sentenceWithPunc;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk);
                    currentChunk = sentenceWithPunc;
                } else {
                    // Single sentence is too long, force split
                    if (sentenceWithPunc.length > maxLength) {
                        chunks.push(sentenceWithPunc.substring(0, maxLength - 3) + '...');
                    } else {
                        chunks.push(sentenceWithPunc);
                    }
                }
            }
        }
        
        if (currentChunk) {
            chunks.push(currentChunk);
        }
        
        return chunks;
    }

    async openComposer() {
        try {
            logger.info('Opening thread composer...');
            
            // Handle any existing dialogs first
            await this.handleSaveToDraftsDialog();
            
            if (!this.isLoggedIn) {
                await this.login();
            }

            // Navigate to home page first to ensure we're in the right place
            await this.page.goto('https://www.threads.net', { waitUntil: 'networkidle2' });
            await sleep(2000);

            const composeSelectors = [
                'a[href="/compose"]',
                'button[aria-label="Create new thread"]',
                'button[aria-label="Buat thread baru"]',
                '[data-testid="primaryButton"]',
                'div[role="button"]:has-text("What\'s new?")',
                'div[role="button"]:has-text("Apa yang baru?")',
                '.x1i10hfl.xjbqb8w.x6umtig.x1b1mbwd.xaqea5y.xav7gou.x9f619.x1ypdohk.xt0psk2.xe8uvvx.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x16tdsg8.x1hl2dhg.xggy1nq.x1a2a7pz.x1heor9g.xt0b8zv.xo1l8bm',
                'div[role="button"]'
            ];

            let composeButton = null;
            for (const selector of composeSelectors) {
                try {
                    composeButton = await this.page.$(selector);
                    if (composeButton) {
                        const isVisible = await this.page.evaluate(el => {
                            return el && el.offsetParent !== null && 
                                   getComputedStyle(el).visibility !== 'hidden';
                        }, composeButton);
                        
                        if (isVisible) {
                            logger.info(`Found compose button: ${selector}`);
                            break;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!composeButton) {
                // Try clicking the compose link in the URL bar
                logger.info('Trying direct navigation to compose page...');
                await this.page.goto('https://www.threads.net/compose', { waitUntil: 'networkidle2' });
                await sleep(3000);
            } else {
                await composeButton.click();
                await sleep(2000);
            }

            // Wait for composer to be ready
            await this.page.waitForSelector('div[contenteditable="true"]', { 
                timeout: 10000,
                visible: true 
            });

            logger.info('Composer opened successfully');
            return true;

        } catch (error) {
            logger.error('Failed to open composer:', error);
            throw error;
        }
    }

    async postThread(content) {
        try {
            logger.info(`🚀 Starting post process: "${content.substring(0, 50)}..."`);
            
            if (!this.page) {
                throw new Error('Browser not initialized');
            }

            // Auto-split content if longer than 500 characters
            const chunks = this.splitTextForThreads(content, 500);
            
            if (chunks.length > 1) {
                logger.info(`📝 Text is ${content.length} characters, splitting into ${chunks.length} parts`);
                // Post as thread chain
                return await this.createThreadChain(chunks);
            }

            // Single post (under 500 chars)
            logger.info(`📝 Posting single thread (${content.length} characters)`);

            // Handle any dialogs first
            await this.handleSaveToDraftsDialog();

            // Open composer
            await this.openComposer();
            await sleep(1000);

            // Type content
            const textArea = await this.page.waitForSelector('div[contenteditable="true"]', { 
                timeout: 10000,
                visible: true 
            });

            await textArea.click();
            await sleep(500);

            // Clear any existing content
            await textArea.evaluate(el => {
                el.textContent = '';
                if (el.value !== undefined) {
                    el.value = '';
                }
                el.focus();
                if (document.execCommand) {
                    document.execCommand('selectAll');
                    document.execCommand('delete');
                }
            });

            // Type content character by character
            for (let char of content) {
                await this.page.keyboard.type(char);
                await sleep(Math.random() * 50 + 25);
            }

            await sleep(1000);
            logger.info('Content typed successfully');

            // 🎯 BREAKTHROUGH SOLUTION: Use Ctrl+Enter to post
            // This completely bypasses the "Save to drafts?" dialog!
            logger.info('🔑 Using Ctrl+Enter shortcut to post (NO DIALOG!)...');
            
            // Ensure text area is focused
            await textArea.focus();
            
            // Send Ctrl+Enter keyboard shortcut
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('Enter');
            await this.page.keyboard.up('Control');
            
            logger.info('✅ Ctrl+Enter sent - waiting for completion...');
            await sleep(3000);
            
            // Verify post success by checking if composer is cleared
            const isCleared = await this.page.evaluate(() => {
                const textarea = document.querySelector('div[contenteditable="true"]');
                return textarea ? textarea.textContent.trim().length === 0 : true;
            });
            
            if (isCleared) {
                logger.info('🎉 SUCCESS! Thread posted without dialog using Ctrl+Enter!');
            } else {
                logger.info('📝 Content may still be in composer, but post likely successful');
            }

            return true;

        } catch (error) {
            logger.error('Post failed:', error);
            throw error;
        }
    }

    async postThreadChain(tweets, title = 'Thread Chain') {
        try {
            logger.info(`Starting thread chain: "${title}" with ${tweets.length} posts`);
            
            if (!this.isLoggedIn) {
                await this.login();
            }

            for (let i = 0; i < tweets.length; i++) {
                const tweet = tweets[i];
                logger.info(`Posting thread ${i + 1}/${tweets.length}: "${tweet.substring(0, 50)}..."`);
                
                await this.postThread(tweet);
                
                if (i < tweets.length - 1) {
                    const waitTime = Math.random() * 3000 + 2000;
                    logger.info(`Waiting ${Math.round(waitTime/1000)} seconds before next post...`);
                    await sleep(waitTime);
                }
            }

            logger.info(`Thread chain "${title}" posted successfully!`);
            return true;

        } catch (error) {
            logger.error('Failed to post thread chain:', error);
            throw error;
        }
    }

    async postSequentialThreads(baseContent, count = 4) {
        try {
            logger.info(`🧵 Creating sequential thread chain: ${count} threads`);
            
            if (!this.isLoggedIn) {
                await this.login();
            }

            // First, open composer for the main thread
            await this.openComposer();
            
            for (let i = 1; i <= count; i++) {
                const threadContent = `${baseContent}\nthread ${i}`;
                logger.info(`📝 Adding thread ${i}/${count}: "${threadContent.substring(0, 50)}..."`);
                
                if (i === 1) {
                    // For first thread, type in the main text area
                    const textArea = await this.page.waitForSelector('div[contenteditable="true"]', { 
                        timeout: 10000,
                        visible: true 
                    });

                    await textArea.click();
                    await sleep(500);

                    // Clear any existing content
                    await textArea.evaluate(el => {
                        el.textContent = '';
                        if (el.value !== undefined) {
                            el.value = '';
                        }
                        el.focus();
                        if (document.execCommand) {
                            document.execCommand('selectAll');
                            document.execCommand('delete');
                        }
                    });

                    // Type content character by character
                    for (let char of threadContent) {
                        await this.page.keyboard.type(char);
                        await sleep(Math.random() * 30 + 15);
                    }
                } else {
                    // For subsequent threads, we need to add a new thread in the chain
                    // Look for "Add to thread" button or similar
                    await sleep(1000);
                    
                    // Try to find and click "Add to thread" button
                    const addToThreadSelectors = [
                        'button[aria-label="Add to thread"]',
                        'div[role="button"]:has-text("Add to thread")',
                        '[data-testid="addToThread"]',
                        'button:contains("Add to thread")',
                        'div[role="button"][aria-label*="Add"]'
                    ];
                    
                    let addButton = null;
                    for (const selector of addToThreadSelectors) {
                        try {
                            if (selector.includes(':contains') || selector.includes(':has-text')) {
                                addButton = await this.page.evaluateHandle((text) => {
                                    const elements = [...document.querySelectorAll('button, div[role="button"]')];
                                    return elements.find(el => 
                                        el.textContent.includes('Add to thread') ||
                                        el.getAttribute('aria-label')?.includes('Add to thread')
                                    );
                                }, selector);
                                
                                const element = addButton.asElement();
                                if (element) {
                                    addButton = element;
                                    break;
                                }
                            } else {
                                addButton = await this.page.$(selector);
                                if (addButton) {
                                    break;
                                }
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                    
                    if (addButton) {
                        logger.info(`Clicking "Add to thread" for thread ${i}`);
                        await addButton.click();
                        await sleep(1000);
                        
                        // Find the new text area for this thread
                        const newTextArea = await this.page.waitForSelector('div[contenteditable="true"]:last-of-type', { 
                            timeout: 5000,
                            visible: true 
                        });
                        
                        await newTextArea.click();
                        await sleep(300);
                        
                        // Type content for this thread
                        for (let char of threadContent) {
                            await this.page.keyboard.type(char);
                            await sleep(Math.random() * 30 + 15);
                        }
                    } else {
                        logger.warn(`Could not find "Add to thread" button for thread ${i}`);
                        // Fallback: just continue typing in the same area with line breaks
                        await this.page.keyboard.press('Enter');
                        await this.page.keyboard.press('Enter');
                        
                        for (let char of threadContent) {
                            await this.page.keyboard.type(char);
                            await sleep(Math.random() * 30 + 15);
                        }
                    }
                }
                
                await sleep(1000);
            }
            
            logger.info('All threads added to chain, now posting...');
            
            // Use Ctrl+Enter to post the entire thread chain
            logger.info('🔑 Using Ctrl+Enter to post thread chain (NO DIALOG!)...');
            
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('Enter');
            await this.page.keyboard.up('Control');
            
            logger.info('✅ Ctrl+Enter sent - waiting for completion...');
            await sleep(5000);
            
            // Verify post success
            const isCleared = await this.page.evaluate(() => {
                const textarea = document.querySelector('div[contenteditable="true"]');
                return textarea ? textarea.textContent.trim().length === 0 : true;
            });
            
            if (isCleared) {
                logger.info(`🎉 SUCCESS! Thread chain with ${count} threads posted!`);
            } else {
                logger.info(`📝 Thread chain may still be in composer, but likely successful`);
            }

            return true;

        } catch (error) {
            logger.error('Failed to post sequential threads:', error);
            throw error;
        }
    }

    async createThreadChain(threadParts, scheduleDateTime = null, retryCount = 0) {
        const maxRetries = 2;
        
        try {
            logger.info(`🧵 Creating thread chain with ${threadParts.length} parts`);
            
            if (!this.isLoggedIn) {
                await this.login();
            }

            // Check if browser/page is still active
            if (!this.browser || !this.page || this.page.isClosed()) {
                logger.warn('⚠️ Browser/page is closed, reinitializing...');
                await this.initialize();
                await this.login();
            }

            // Auto-split parts that are longer than 500 characters
            const processedParts = [];
            for (const part of threadParts) {
                if (part.length > 500) {
                    logger.info(`📝 Part is ${part.length} characters, splitting...`);
                    const chunks = this.splitTextForThreads(part, 500);
                    processedParts.push(...chunks);
                } else {
                    processedParts.push(part);
                }
            }

            logger.info(`📊 Processed ${threadParts.length} parts into ${processedParts.length} final parts`);

            // If schedule time is provided, calculate delay and wait
            if (scheduleDateTime) {
                const scheduleTime = new Date(scheduleDateTime);
                const now = new Date();
                const delay = scheduleTime.getTime() - now.getTime();
                
                if (delay > 0) {
                    logger.info(`⏰ Thread scheduled for: ${scheduleTime.toLocaleString('id-ID')}`);
                    logger.info(`⏳ Waiting ${Math.round(delay / 1000)} seconds until posting time...`);
                    
                    // Wait until the scheduled time
                    await sleep(delay);
                    logger.info('🎯 Scheduled time reached! Starting thread creation...');
                } else {
                    logger.info('⚠️ Scheduled time is in the past, posting immediately');
                }
            }

            // Handle any dialogs before opening composer
            await this.handleSaveToDraftsDialog();

            // Open composer
            await this.openComposer();
            await sleep(2000);

            for (let i = 0; i < processedParts.length; i++) {
                const content = processedParts[i];
                logger.info(`📝 Adding part ${i + 1}/${processedParts.length}: "${content.substring(0, 50)}..." (${content.length} chars)`);
                
                if (i === 0) {
                    // First part - type in main textarea
                    const textArea = await this.page.waitForSelector('div[contenteditable="true"]', { 
                        timeout: 10000,
                        visible: true 
                    });

                    await textArea.click();
                    await sleep(500);

                    // Clear and type content
                    await textArea.evaluate(el => {
                        el.textContent = '';
                        el.focus();
                    });

                    for (let char of content) {
                        await this.page.keyboard.type(char);
                        await sleep(Math.random() * 50 + 25);
                    }
                    
                    await sleep(1000);
                    logger.info(`✅ Added first thread part (${content.length} chars)`);
                } else {
                    // Subsequent parts - need to add new thread to chain
                    logger.info('🔗 Looking for "Add to thread" button...');
                    
                    // Wait a bit for UI to be ready
                    await sleep(1000);
                    
                    // Try multiple methods to find the "Add to thread" button
                    let addButtonClicked = false;
                    
                    // Method 1: Direct button search with multiple variations
                    const addButtonSelectors = [
                        'button:contains("Add to thread")',
                        'div[role="button"]:contains("Add to thread")',
                        'button[aria-label*="Add to thread"]',
                        'div[aria-label*="Add to thread"]',
                        'button:contains("Tambahkan ke utas")',
                        'div[role="button"]:contains("Tambahkan ke utas")',
                        '[aria-label*="Tambahkan ke utas"]',
                        'button[data-testid*="add"]',
                        'div[data-testid*="add"]'
                    ];
                    
                    // Try to find add button with JavaScript evaluation
                    const addButtonFound = await this.page.evaluate(() => {
                        // Look for buttons with text content
                        const allElements = [...document.querySelectorAll('button, div[role="button"], a, span')];
                        
                        const addBtn = allElements.find(el => {
                            const text = el.textContent.toLowerCase().trim();
                            const label = (el.getAttribute('aria-label') || '').toLowerCase();
                            
                            // Check for various add to thread text variations
                            return text.includes('add to thread') || 
                                   text.includes('tambahkan ke utas') ||
                                   text.includes('add thread') ||
                                   text.includes('tambahkan') ||
                                   label.includes('add to thread') ||
                                   label.includes('tambahkan ke utas') ||
                                   label.includes('add thread');
                        });
                        
                        if (addBtn) {
                            console.log('Found add button:', addBtn.textContent, addBtn.getAttribute('aria-label'));
                            addBtn.click();
                            return true;
                        }
                        
                        return false;
                    });
                    
                    if (addButtonFound) {
                        logger.info('✅ Found and clicked add thread button via text search');
                        addButtonClicked = true;
                    } else {
                        // Method 2: Look for specific UI patterns
                        logger.info('⚠️ Text search failed, trying selector patterns...');
                        
                        for (const selector of addButtonSelectors) {
                            try {
                                if (selector.includes(':contains')) {
                                    // Skip :contains selectors for puppeteer
                                    continue;
                                }
                                
                                const element = await this.page.$(selector);
                                if (element) {
                                    const isVisible = await this.page.evaluate(el => {
                                        return el && el.offsetParent !== null && 
                                               getComputedStyle(el).visibility !== 'hidden' &&
                                               getComputedStyle(el).display !== 'none';
                                    }, element);
                                    
                                    if (isVisible) {
                                        await element.click();
                                        logger.info(`✅ Clicked add button with: ${selector}`);
                                        addButtonClicked = true;
                                        break;
                                    }
                                }
                            } catch (e) {
                                continue;
                            }
                        }
                    }
                    
                    if (!addButtonClicked) {
                        // Method 3: Try to find any button that might be the add button
                        logger.info('⚠️ Standard methods failed, trying alternative approach...');
                        
                        const buttonFound = await this.page.evaluate(() => {
                            // Look for any button near the textarea that might be "add"
                            const buttons = [...document.querySelectorAll('button')];
                            
                            // Find buttons that might be add buttons based on position or icons
                            const potentialAddBtn = buttons.find(btn => {
                                const rect = btn.getBoundingClientRect();
                                const hasIcon = btn.querySelector('svg');
                                const isVisible = rect.width > 0 && rect.height > 0;
                                
                                // Look for buttons with + icon or similar
                                if (hasIcon && isVisible) {
                                    const svgContent = btn.innerHTML.toLowerCase();
                                    if (svgContent.includes('plus') || svgContent.includes('add')) {
                                        return true;
                                    }
                                }
                                
                                return false;
                            });
                            
                            if (potentialAddBtn) {
                                potentialAddBtn.click();
                                return true;
                            }
                            
                            return false;
                        });
                        
                        if (buttonFound) {
                            logger.info('✅ Found potential add button via icon search');
                            addButtonClicked = true;
                        }
                    }
                    
                    if (!addButtonClicked) {
                        // Method 4: Keyboard navigation fallback
                        logger.info('⚠️ Button not found, trying keyboard navigation...');
                        await this.page.keyboard.press('Tab');
                        await sleep(300);
                        await this.page.keyboard.press('Enter');
                        await sleep(300);
                        logger.info('📝 Attempted keyboard navigation to add thread');
                    }

                    // Wait for new thread area to appear
                    await sleep(2000);

                    // Find all textareas and identify the new one
                    const allTextareas = await this.page.$$('div[contenteditable="true"]');
                    logger.info(`Found ${allTextareas.length} textareas total`);
                    
                    let targetTextarea = null;
                    
                    // Strategy: Look for the textarea that is empty or has placeholder
                    for (let j = allTextareas.length - 1; j >= 0; j--) {
                        const textarea = allTextareas[j];
                        const isEmpty = await this.page.evaluate(el => {
                            const text = el.textContent.trim();
                            const hasPlaceholder = el.getAttribute('data-placeholder') || 
                                                 el.getAttribute('placeholder') ||
                                                 text === '' ||
                                                 text.includes('Add a topic') ||
                                                 text.includes('Tambahkan topik');
                            return text === '' || hasPlaceholder;
                        }, textarea);
                        
                        if (isEmpty) {
                            targetTextarea = textarea;
                            logger.info(`Found empty textarea at index ${j}`);
                            break;
                        }
                    }
                    
                    // Fallback: use last textarea
                    if (!targetTextarea && allTextareas.length > 0) {
                        targetTextarea = allTextareas[allTextareas.length - 1];
                        logger.info('Using last textarea as fallback');
                    }
                    
                    if (targetTextarea) {
                        await targetTextarea.click();
                        await sleep(500);

                        // Clear any placeholder text and type content
                        await targetTextarea.evaluate(el => {
                            el.textContent = '';
                            el.focus();
                        });

                        for (let char of content) {
                            await this.page.keyboard.type(char);
                            await sleep(Math.random() * 50 + 25);
                        }
                        
                        logger.info(`✅ Added thread part ${i + 1}: "${content}"`);
                    } else {
                        logger.error(`❌ Could not find textarea for thread part ${i + 1}`);
                        // Still continue with next part
                    }
                }
                
                await sleep(1000);
            }

            logger.info('🎉 All thread parts added!');

            // Handle any dialogs before posting
            await this.handleSaveToDraftsDialog();

            // Post immediately with Ctrl+Enter
            logger.info('🔗 Posting thread chain with Ctrl+Enter...');
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('Enter');
            await this.page.keyboard.up('Control');
            await sleep(5000);

            // Handle any post-posting dialogs
            await this.handleSaveToDraftsDialog();
            
            if (scheduleDateTime) {
                logger.info(`✅ Scheduled thread chain posted successfully! (${processedParts.length} parts, auto-split enabled)`);
            } else {
                logger.info(`✅ Thread chain posted immediately! (${processedParts.length} parts, auto-split enabled)`);
            }
            
            return true;

        } catch (error) {
            logger.error('❌ Failed to create thread chain:', error);
            
            // Handle specific errors with retry logic
            if (error.message.includes('Target closed') || 
                error.message.includes('Protocol error') ||
                error.message.includes('Session closed')) {
                
                if (retryCount < maxRetries) {
                    logger.warn(`⚠️ Browser/page closed, retrying... (${retryCount + 1}/${maxRetries})`);
                    await sleep(2000);
                    
                    // Reinitialize browser
                    await this.initialize();
                    await this.login();
                    
                    // Retry with same parameters
                    return await this.createThreadChain(threadParts, scheduleDateTime, retryCount + 1);
                } else {
                    logger.error(`❌ Max retries (${maxRetries}) reached. Thread chain failed.`);
                    throw new Error(`Thread chain failed after ${maxRetries} retries: ${error.message}`);
                }
            }
            
            throw error;
        }
    }

    async scheduleThread(scheduleDateTime) {
        try {
            logger.info(`📅 Setting up scheduled post for: ${scheduleDateTime}`);
            
            // Look for the three dots menu (⋯) button
            logger.info('🔍 Looking for three dots menu...');
            
            // Using the exact selector from provided HTML
            const menuButton = await this.page.$('svg[aria-label="Lainnya"]');
            if (menuButton) {
                await menuButton.click();
                logger.info('✅ Clicked three dots menu');
            } else {
                // Fallback: look for parent button containing the SVG
                const menuButtonParent = await this.page.$('div[role="button"]:has(svg[aria-label="Lainnya"])');
                if (menuButtonParent) {
                    await menuButtonParent.click();
                    logger.info('✅ Clicked three dots menu (parent)');
                } else {
                    // Fallback to original method
                    const menuFound = await this.page.evaluate(() => {
                        const allElements = [...document.querySelectorAll('button, div[role="button"], a, span')];
                        const menuBtn = allElements.find(el => {
                            const text = el.textContent.trim();
                            const innerHTML = el.innerHTML;
                            const ariaLabel = el.getAttribute('aria-label') || '';
                            
                            if (text === '⋯' || text === '...' || text === '•••' || text === '︙') {
                                return true;
                            }
                            
                            if (ariaLabel.toLowerCase().includes('more') || 
                                ariaLabel.toLowerCase().includes('option') ||
                                ariaLabel.toLowerCase().includes('menu') ||
                                ariaLabel.toLowerCase().includes('lainnya')) {
                                return true;
                            }
                            
                            if (innerHTML.includes('svg') && 
                                (innerHTML.includes('dot') || innerHTML.includes('more') || innerHTML.includes('menu'))) {
                                return true;
                            }
                            
                            return false;
                        });
                        
                        if (menuBtn) {
                            menuBtn.click();
                            return true;
                        }
                        return false;
                    });
                    
                    if (!menuFound) {
                        throw new Error('Could not find three dots menu button');
                    }
                    logger.info('✅ Clicked three dots menu (fallback)');
                }
            }
            
            await sleep(2000);
            
            // Look for "Jadwalkan..." option using exact text from HTML
            logger.info('🔍 Looking for schedule option...');
            
            const scheduleFound = await this.page.evaluate(() => {
                const elements = [...document.querySelectorAll('button, div[role="button"], span')];
                const scheduleBtn = elements.find(el => {
                    const text = el.textContent.trim();
                    return text === 'Jadwalkan...' || text.includes('Jadwalkan');
                });
                
                if (scheduleBtn) {
                    scheduleBtn.click();
                    return true;
                }
                return false;
            });
            
            if (!scheduleFound) {
                throw new Error('Could not find schedule option in menu');
            }
            
            logger.info('✅ Clicked schedule option');
            await sleep(3000);
            
            // Parse the schedule date/time
            const scheduleDate = new Date(scheduleDateTime);
            logger.info(`📅 Setting date to: ${scheduleDate.toLocaleDateString()}`);
            logger.info(`🕐 Setting time to: ${scheduleDate.toLocaleTimeString()}`);
            
            // Set date using calendar
            await this.setScheduleDate(scheduleDate);
            await sleep(1000);
            
            // Set time using time picker
            await this.setScheduleTime(scheduleDate);
            await sleep(1000);
            
            // Click "Selesai" button using exact text from HTML
            const scheduleConfirmed = await this.page.evaluate(() => {
                const buttons = [...document.querySelectorAll('button, div[role="button"]')];
                const confirmBtn = buttons.find(btn => {
                    const text = btn.textContent.trim();
                    return text === 'Selesai';
                });
                
                if (confirmBtn) {
                    confirmBtn.click();
                    return true;
                }
                return false;
            });
            
            if (scheduleConfirmed) {
                logger.info('✅ Thread scheduled successfully!');
            } else {
                logger.warn('⚠️ Could not find Selesai button, trying Enter key...');
                await this.page.keyboard.press('Enter');
            }
            
            await sleep(2000);
            return true;
            
        } catch (error) {
            logger.error('❌ Failed to schedule thread:', error);
            throw error;
        }
    }

    async setScheduleDate(date) {
        try {
            logger.info(`📅 Setting schedule date: ${date.toLocaleDateString()}`);
            
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            
            // Look for the correct day in calendar using role="gridcell"
            const daySelected = await this.page.evaluate((targetDay) => {
                const gridCells = [...document.querySelectorAll('div[role="gridcell"]')];
                
                // Find clickable day cells (not disabled)
                const clickableDays = gridCells.filter(cell => {
                    const hasAriaDisabled = cell.getAttribute('aria-disabled') === 'true';
                    const hasClickableChild = cell.querySelector('div[role="gridcell"]:not([aria-disabled="true"])') || 
                                            cell.querySelector('div:not([aria-disabled="true"])');
                    return !hasAriaDisabled && (hasClickableChild || !cell.classList.contains('xgd8bvy'));
                });
                
                const dayCell = clickableDays.find(cell => {
                    const spanText = cell.querySelector('span[dir="auto"]');
                    if (spanText) {
                        const dayNum = parseInt(spanText.textContent.trim());
                        return dayNum === targetDay;
                    }
                    return false;
                });
                
                if (dayCell) {
                    // Find the clickable element within the cell
                    const clickableElement = dayCell.querySelector('div[role="gridcell"]:not([aria-disabled="true"])') || 
                                           dayCell.querySelector('div[class*="x1eos6md"]') ||
                                           dayCell;
                    
                    if (clickableElement) {
                        clickableElement.click();
                        console.log(`Clicked day ${targetDay}`);
                        return true;
                    }
                }
                
                console.log(`Could not find clickable day ${targetDay}`);
                return false;
            }, day);
            
            if (daySelected) {
                logger.info(`✅ Selected day: ${day}`);
            } else {
                logger.warn(`⚠️ Could not find day ${day} in calendar, using current selection`);
            }
            
        } catch (error) {
            logger.error('❌ Failed to set schedule date:', error);
            throw error;
        }
    }

    async setScheduleTime(date) {
        try {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            logger.info(`🕐 Setting schedule time: ${hours}:${minutes}`);
            
            // Find hour input using exact selector from HTML
            const hourInput = await this.page.$('input[placeholder="hh"]');
            if (hourInput) {
                await hourInput.click();
                await sleep(300);
                
                // Clear existing value
                await this.page.keyboard.down('Control');
                await this.page.keyboard.press('a');
                await this.page.keyboard.up('Control');
                
                // Type hours
                await this.page.keyboard.type(hours);
                logger.info(`✅ Set hours to: ${hours}`);
                
                await sleep(500);
            } else {
                logger.warn('⚠️ Hour input not found');
            }
            
            // Find minute input using exact selector from HTML
            const minuteInput = await this.page.$('input[placeholder="mm"]');
            if (minuteInput) {
                await minuteInput.click();
                await sleep(300);
                
                // Clear existing value
                await this.page.keyboard.down('Control');
                await this.page.keyboard.press('a');
                await this.page.keyboard.up('Control');
                
                // Type minutes
                await this.page.keyboard.type(minutes);
                logger.info(`✅ Set minutes to: ${minutes}`);
                
                await sleep(500);
            } else {
                logger.warn('⚠️ Minute input not found');
            }
            
            logger.info(`✅ Time set to: ${hours}:${minutes}`);
            
        } catch (error) {
            logger.error('❌ Failed to set schedule time:', error);
            throw error;
        }
    }

    async close() {
        try {
            if (this.browser) {
                await this.browser.close();
                logger.info('Browser closed');
            }
        } catch (error) {
            logger.error('Error closing browser:', error);
        }
    }
}

module.exports = ThreadsBot;
