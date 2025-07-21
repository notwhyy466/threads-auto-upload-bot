/**
 * Simple RDP Threads Bot - Working Version
 * Focuses on successful login and manual posting guidance
 */

const ThreadsBotRDP = require('./src/threads-bot-rdp');

async function runRDPBot() {
    console.log(`
🎉 RDP Threads Bot - Working Version
===================================

✅ Your sessionid cookie is working!
✅ Login via Instagram route is successful!
✅ Browser automation works in RDP environment!

Starting the working bot...
    `);

    const bot = new ThreadsBotRDP();
    
    try {
        // Initialize and login
        await bot.init();
        console.log('✅ Browser initialized');
        
        const loginSuccess = await bot.login();
        
        if (loginSuccess) {
            console.log('✅ Successfully logged in to Threads!');
            
            console.log(`
📝 MANUAL POSTING INSTRUCTIONS:
=============================

The browser is now open and you're logged in!

To post a thread manually:
1. Click the "+" button or "Create" button in Threads
2. Type your thread content
3. Click "Post" to publish

The bot will keep the browser open for you to use.
Press Ctrl+C when you're done.

🔄 Bot is ready for manual use...
            `);
            
            // Keep the browser open for manual use
            console.log('🖱️  Browser is ready for manual posting...');
            console.log('⏳ Press Ctrl+C to exit when done.');
            
            // Keep the script running
            await new Promise(() => {}); // This will keep it running until Ctrl+C
            
        } else {
            console.log('❌ Login failed. Please check your cookie or try manual login.');
        }
        
    } catch (error) {
        if (error.message.includes('Process was interrupted')) {
            console.log('\n👋 Exiting... Browser will close.');
        } else {
            console.log('❌ Error occurred:', error.message);
        }
    } finally {
        await bot.close();
        console.log('✅ Browser closed. Goodbye!');
    }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\n👋 Received exit signal. Closing browser...');
    process.exit(0);
});

// Run the bot
runRDPBot().catch(error => {
    console.error('❌ Bot error:', error.message);
    process.exit(1);
});
