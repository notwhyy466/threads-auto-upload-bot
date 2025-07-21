/**
 * Test script for RDP environment with manual cookie setup
 */

const ThreadsBotRDP = require('./src/threads-bot-rdp');
const logger = require('./src/utils/logger');

async function testRDPEnvironment() {
    console.log(`
🖥️  RDP Environment Test for Threads Bot
=====================================

This test will:
1. Check if manual cookies are available
2. Initialize browser in RDP-optimized mode
3. Test login with cookies
4. Verify posting capability

Starting test...
    `);

    const bot = new ThreadsBotRDP();
    
    try {
        // Initialize browser
        console.log('📦 Initializing browser...');
        await bot.init();
        console.log('✅ Browser initialized successfully');
        
        // Test login
        console.log('🔐 Testing login...');
        const loginSuccess = await bot.login();
        
        if (loginSuccess) {
            console.log('✅ Login successful!');
            
            // Test posting a simple thread
            console.log('📝 Testing thread posting...');
            const testContent = `Test post from RDP bot - ${new Date().toLocaleString()}`;
            
            const postSuccess = await bot.postThread(testContent);
            
            if (postSuccess) {
                console.log('✅ Thread posted successfully!');
                console.log('🎉 RDP environment test PASSED!');
            } else {
                console.log('❌ Thread posting failed');
                console.log('⚠️  RDP environment test PARTIALLY PASSED (login works, posting needs manual verification)');
            }
        } else {
            console.log('❌ Login failed');
            console.log('💡 Please make sure to:');
            console.log('   1. Add your sessionid cookie using: node manual-cookie-setup.js add-session "your_sessionid"');
            console.log('   2. Ensure you have stable internet connection');
            console.log('   3. Try manual login when prompted');
        }
        
    } catch (error) {
        console.log('❌ Test failed with error:', error.message);
        logger.error('RDP test error:', error);
    } finally {
        // Close browser
        console.log('🔄 Closing browser...');
        await bot.close();
        console.log('✅ Browser closed');
        console.log('\n📋 Test completed!');
    }
}

// Run the test
if (require.main === module) {
    testRDPEnvironment().catch(error => {
        console.error('Test script error:', error);
        process.exit(1);
    });
}

module.exports = testRDPEnvironment;
