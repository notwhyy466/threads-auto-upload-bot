#!/usr/bin/env node

require('dotenv').config();
const readline = require('readline');
const config = require('./config/config');
const logger = require('./src/utils/logger');
const Scheduler = require('./src/scheduler');
const SimpleScheduler = require('./src/simple-scheduler');
const ThreadsBot = require('./src/threads-bot');
const SheetsClient = require('./src/sheets-client');
const CSVClient = require('./src/csv-client');

class ThreadsBotApp {
  constructor() {
    this.scheduler = new Scheduler();
    this.simpleScheduler = new SimpleScheduler(); // Add SimpleScheduler
    this.threadsBot = null; // Will be initialized when needed for login
    this.sheetsClient = new SheetsClient();
    this.csvClient = new CSVClient();
    this.dataSource = 'csv'; // Default to CSV instead of Google Sheets
    this.schedulerType = 'simple'; // Default to SimpleScheduler (more reliable)
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Ask a question and return the answer
   */
  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Show main menu
   */
  showMenu() {
    console.clear();
    console.log('\n' + '='.repeat(60));
    console.log('🧵 THREADS AUTO POSTING BOT');
    console.log('='.repeat(60));
    console.log('📁 CSV MANAGEMENT:');
    console.log('1. List Available CSV Files');
    console.log('2. Load CSV File');
    console.log('3. Create Sample CSV');
    console.log('4. View Current CSV Data');
    console.log('');
    console.log('🤖 BOT OPERATIONS:');
    console.log('5. Manual Login to Threads');
    console.log('6. Post Thread Manually');
    console.log('7. Start Smart Scheduler (Recommended)');
    console.log('8. Schedule Individual Thread');
    console.log('9. Quick Test: Schedule 1 Thread in 30 seconds');
    console.log('10. Check Status');
    console.log('11. Stop Scheduler');
    console.log('');
    console.log('⚙️  OTHER:');
    console.log('12. Test Connection');
    console.log('13. Switch Scheduler Type');
    console.log('14. Exit');
    console.log('='.repeat(60));
    
    // Show current data source info
    if (this.dataSource === 'csv') {
      const csvInfo = this.csvClient.getCurrentCSVInfo();
      if (csvInfo.filename) {
        console.log(`📄 Current CSV: ${csvInfo.filename} (${csvInfo.threadsCount} threads)`);
      } else {
        console.log('📄 No CSV file loaded');
      }
    }
    
    // Show scheduler type
    console.log(`⚙️  Scheduler: ${this.schedulerType === 'simple' ? '🚀 Smart (SimpleScheduler)' : '⏰ Cron (Traditional)'}`);
  }

  /**
   * Test connections
   */
  async testConnection() {
    console.log('\n🔍 Testing connections...');
    
    try {
      // Test Google Sheets
      console.log('📊 Testing Google Sheets connection...');
      const sheetsConnected = await this.sheetsClient.testConnection();
      console.log(`Google Sheets: ${sheetsConnected ? '✅ Connected' : '❌ Failed'}`);

      // Test sample data as fallback
      if (!sheetsConnected) {
        console.log('📋 Testing sample data fallback...');
        const sampleData = await this.sheetsClient.getThreadData();
        console.log(`Sample Data: ${sampleData.length > 0 ? '✅ Available' : '❌ Failed'}`);
      }

      // Test scheduler initialization
      console.log('⏰ Testing scheduler...');
      const schedulerTest = await this.scheduler.test();
      console.log(`Scheduler: ${schedulerTest ? '✅ OK' : '❌ Failed'}`);

      console.log('\n✅ Connection test completed');
      
    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`);
    }
  }

  /**
   * List available CSV files
   */
  async listCSVFiles() {
    console.log('\n📁 Available CSV Files');
    console.log('='.repeat(50));
    
    try {
      const files = this.csvClient.getAvailableFiles();
      
      if (files.length === 0) {
        console.log('📭 No files found in data/csv/ folder');
        console.log('💡 Tip: Use "Create Sample CSV" to get started or place your CSV/Excel files there');
        return;
      }

      files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.name} [${file.type}]`);
        console.log(`   Size: ${Math.round(file.size / 1024)}KB | Modified: ${file.modified}`);
        console.log('');
      });

    } catch (error) {
      console.log(`❌ Failed to list CSV files: ${error.message}`);
    }
  }

  /**
   * Load CSV file
   */
  async loadCSVFile() {
    console.log('\n📂 Load CSV File');
    
    try {
      const files = this.csvClient.getAvailableFiles();
      
      if (files.length === 0) {
        console.log('📭 No files found');
        console.log('💡 Create a sample CSV first or place your CSV/Excel files in data/csv/ folder');
        return;
      }

      console.log('\nAvailable files:');
      files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.nameWithoutExt} [${file.type}]`);
      });

      const choice = await this.askQuestion('\nEnter file number or filename: ');
      
      let filename;
      if (/^\d+$/.test(choice)) {
        // User entered a number
        const index = parseInt(choice) - 1;
        if (index >= 0 && index < files.length) {
          filename = files[index].nameWithoutExt;
        } else {
          console.log('❌ Invalid file number');
          return;
        }
      } else {
        // User entered filename
        filename = choice;
      }

      console.log(`📥 Loading CSV file: ${filename}...`);
      const threads = await this.csvClient.loadThreadsFromCSV(filename);
      
      console.log(`✅ Successfully loaded ${threads.length} threads from ${filename}`);
      
      if (threads.length > 0) {
        console.log('\nPreview of loaded threads:');
        threads.slice(0, 3).forEach(thread => {
          console.log(`• ${thread.title} (${thread.tweets.length} posts)`);
        });
        if (threads.length > 3) {
          console.log(`... and ${threads.length - 3} more threads`);
        }
      }

    } catch (error) {
      console.log(`❌ Failed to load CSV: ${error.message}`);
    }
  }

  /**
   * Create sample CSV file
   */
  async createSampleCSV() {
    console.log('\n📝 Creating Sample CSV File');
    
    try {
      const created = this.csvClient.createSampleFile();
      
      if (created) {
        console.log('✅ Sample CSV file created: data/csv/sample-threads.csv');
        console.log('\n📋 CSV Format:');
        console.log('id,title,tweet1,tweet2,tweet3,tweet4,tweet5,scheduledTime');
        console.log('');
        console.log('💡 Tips:');
        console.log('• Use quotes for text containing commas');
        console.log('• scheduledTime format: HH:MM (24-hour format)');
        console.log('• You can have 1-5 tweets per thread');
        console.log('• Empty tweet columns will be ignored');
        
        const loadSample = await this.askQuestion('\nLoad the sample CSV now? (y/n): ');
        if (loadSample.toLowerCase() === 'y') {
          await this.csvClient.loadThreadsFromCSV('sample-threads');
          console.log('✅ Sample CSV loaded!');
        }
      } else {
        console.log('❌ Failed to create sample CSV');
      }

    } catch (error) {
      console.log(`❌ Failed to create sample CSV: ${error.message}`);
    }
  }

  /**
   * View current CSV data
   */
  async viewCurrentCSVData() {
    console.log('\n📊 Current CSV Data');
    
    try {
      const threads = await this.csvClient.getThreadData();
      
      if (threads.length === 0) {
        console.log('📭 No threads loaded');
        console.log('💡 Load a CSV file first using "Load CSV File" option');
        return;
      }

      const csvInfo = this.csvClient.getCurrentCSVInfo();
      console.log(`\n📄 File: ${csvInfo.filename}`);
      console.log(`📊 Threads: ${csvInfo.threadsCount}`);
      console.log('='.repeat(80));
      
      threads.forEach(thread => {
        console.log(`ID: ${thread.id}`);
        console.log(`Title: ${thread.title || 'No title'}`);
        console.log(`Posts: ${thread.tweets.length}`);
        console.log(`Scheduled: ${thread.scheduledTime || 'Not scheduled'}`);
        console.log(`Preview: ${thread.tweets[0]?.substring(0, 80)}...`);
        console.log('-'.repeat(50));
      });
      
    } catch (error) {
      console.log(`❌ Failed to view CSV data: ${error.message}`);
    }
  }

  /**
   * View threads data
   */
  async viewThreadsData() {
    console.log('\n📋 Loading threads data...');
    
    try {
      const threads = await this.sheetsClient.getThreadData();
      
      if (threads.length === 0) {
        console.log('📭 No threads found');
        return;
      }

      console.log(`\n📊 Found ${threads.length} threads:`);
      console.log('='.repeat(80));
      
      threads.forEach(thread => {
        console.log(`ID: ${thread.id}`);
        console.log(`Title: ${thread.title || 'No title'}`);
        console.log(`Posts: ${thread.tweets.length}`);
        console.log(`Scheduled: ${thread.scheduledTime || 'Not scheduled'}`);
        console.log(`Preview: ${thread.tweets[0]?.substring(0, 50)}...`);
        console.log('-'.repeat(50));
      });
      
    } catch (error) {
      console.log(`❌ Failed to load threads: ${error.message}`);
    }
  }

  /**
   * Manual login to Threads
   */
  async manualLogin() {
    console.log('\n🔐 Manual Login to Threads');
    
    try {
      if (!this.threadsBot) {
        this.threadsBot = new ThreadsBot();
      }

      if (!this.threadsBot.browser) {
        await this.threadsBot.initialize();
      }

      if (this.threadsBot.isLoggedIn) {
        console.log('✅ Already logged in to Threads');
        return;
      }

      console.log('🌐 Opening Threads login page...');
      console.log('📝 Please login manually in the browser if needed');
      console.log('⏳ Waiting for login completion...');
      
      // The login method now handles both automatic detection and manual login
      const loginResult = await this.threadsBot.login();
      
      if (loginResult && this.threadsBot.isLoggedIn) {
        console.log('✅ Successfully logged in to Threads!');
        console.log('💾 Session will be saved for future use');
      } else {
        console.log('❌ Login failed or was cancelled');
      }
      
    } catch (error) {
      console.log(`❌ Login failed: ${error.message}`);
    }
  }

  /**
   * Start Smart Scheduler
   */
  async startSmartScheduler() {
    console.log('\n🚀 Starting Smart Scheduler (SimpleScheduler)...');
    
    try {
      // Load threads from CSV
      const threads = await this.csvClient.getThreadData();
      
      if (threads.length === 0) {
        console.log('📭 No threads found');
        console.log('💡 Load a CSV file first using "Load CSV File" option');
        return;
      }

      // Check if we have an existing logged-in bot
      if (this.threadsBot && this.threadsBot.isLoggedIn) {
        console.log('✅ Using existing logged-in bot session');
        this.simpleScheduler.setBot(this.threadsBot);
      } else {
        console.log('🔐 Initializing new bot session...');
        console.log('⚠️  If this fails, try "Manual Login to Threads" first');
        
        // Initialize SimpleScheduler (will create new bot)
        await this.simpleScheduler.initialize();
      }
      
      console.log(`✅ Smart Scheduler ready! Found ${threads.length} threads`);
      console.log('\n📋 Scheduling Options:');
      console.log('1. Schedule all threads with custom interval');
      console.log('2. Schedule specific threads with custom time');
      console.log('3. Quick schedule next 3 threads (every 5 minutes)');
      console.log('4. Schedule thread chains (multi-part threads)');
      
      const option = await this.askQuestion('\nChoose scheduling option (1-4): ');
      
      switch (option) {
        case '1':
          await this.scheduleAllThreadsFromCSV(threads);
          break;
        case '2':
          await this.scheduleSpecificThreads(threads);
          break;
        case '3':
          await this.quickScheduleThreads(threads);
          break;
        case '4':
          await this.scheduleThreadChains(threads);
          break;
        default:
          console.log('❌ Invalid option');
          return;
      }
      
    } catch (error) {
      console.log(`❌ Failed to start Smart Scheduler: ${error.message}`);
      
      if (error.message.includes('Failed to launch')) {
        console.log('\n💡 TROUBLESHOOTING TIPS:');
        console.log('1. Try option "5. Manual Login to Threads" first');
        console.log('2. Make sure Chrome is installed');
        console.log('3. Close other Chrome instances');
        console.log('4. Check if Chrome path is correct in config');
      }
    }
  }

  /**
   * Schedule threads using times from CSV/Excel data
   */
  async scheduleThreadsFromCSVTimes(threads) {
    console.log('\n📅 Smart Daily Scheduling with Catch-up System...');
    console.log('⏰ Daily posting times: 06:00, 09:00, 12:00, 15:00, 18:00, 20:00');
    
    // Filter threads that have scheduled times
    const threadsWithTime = threads.filter(thread => thread.scheduledTime);
    const threadsWithoutTime = threads.filter(thread => !thread.scheduledTime);
    
    if (threadsWithTime.length === 0) {
      console.log('❌ No threads found with scheduled times in CSV/Excel');
      console.log('💡 Try option 2 to schedule with custom interval instead');
      return;
    }
    
    console.log(`\n📊 Found ${threadsWithTime.length} threads with scheduled times`);
    if (threadsWithoutTime.length > 0) {
      console.log(`⚠️  ${threadsWithoutTime.length} threads will be skipped (no scheduled time)`);
    }
    
    // Daily posting hours (24-hour format)
    const dailyHours = [6, 9, 12, 15, 18, 20];
    const now = new Date();
    const currentHour = now.getHours();
    
    // Check which slots are missed today
    const missedSlots = dailyHours.filter(hour => hour < currentHour);
    const upcomingSlots = dailyHours.filter(hour => hour >= currentHour);
    
    console.log(`\n🕐 Current time: ${now.toLocaleTimeString('id-ID')}`);
    if (missedSlots.length > 0) {
      console.log(`⏰ Missed slots today: ${missedSlots.join(':00, ')}:00 (${missedSlots.length} slots)`);
      console.log(`🚀 These will be posted immediately as catch-up`);
    }
    if (upcomingSlots.length > 0) {
      console.log(`📅 Available slots today: ${upcomingSlots.join(':00, ')}:00 (${upcomingSlots.length} slots)`);
    }
    
    // Calculate how many days needed
    const totalSlotsNeeded = threadsWithTime.length;
    const todayAvailableSlots = upcomingSlots.length;
    const threadsAfterToday = Math.max(0, totalSlotsNeeded - todayAvailableSlots - missedSlots.length);
    const daysNeeded = 1 + Math.ceil(threadsAfterToday / 6);
    
    console.log(`\n📋 Scheduling Plan:`);
    console.log(`• Immediate catch-up posts: ${Math.min(missedSlots.length, threadsWithTime.length)}`);
    console.log(`• Today's remaining slots: ${Math.min(todayAvailableSlots, Math.max(0, threadsWithTime.length - missedSlots.length))}`);
    console.log(`• Future days needed: ${Math.max(0, daysNeeded - 1)} days`);
    console.log(`• Total estimated days: ${daysNeeded} days`);
    
    const confirm = await this.askQuestion(`\nProceed with smart scheduling? (y/n): `);
    if (confirm.toLowerCase() !== 'y') {
      console.log('❌ Scheduling cancelled');
      return;
    }
    
    let scheduled = 0;
    let skipped = 0;
    let immediateCount = 0;
    let currentDay = 0;
    let currentSlot = 0;
    
    console.log('\n🚀 Starting smart scheduling...\n');
    
    for (const thread of threadsWithTime) {
      try {
        let scheduleTime;
        let isImmediate = false;
        
        // Check if we should post immediately (catch-up for missed slots)
        if (immediateCount < missedSlots.length) {
          // Post immediately for missed slots
          scheduleTime = new Date(now.getTime() + (immediateCount * 30000)); // 30 seconds apart
          isImmediate = true;
          immediateCount++;
        } else {
          // Calculate normal schedule time based on day and slot
          scheduleTime = new Date();
          
          if (currentDay === 0) {
            // Today - use upcoming slots only
            if (currentSlot < upcomingSlots.length) {
              scheduleTime.setHours(upcomingSlots[currentSlot], 0, 0, 0);
            } else {
              // Move to tomorrow
              currentDay = 1;
              currentSlot = 0;
              scheduleTime.setDate(scheduleTime.getDate() + 1);
              scheduleTime.setHours(dailyHours[currentSlot], 0, 0, 0);
            }
          } else {
            // Future days - use all slots
            scheduleTime.setDate(scheduleTime.getDate() + currentDay);
            scheduleTime.setHours(dailyHours[currentSlot], 0, 0, 0);
          }
        }
        
        const taskId = `smart-scheduled-${thread.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        if (thread.tweets.length > 1) {
          // Multi-part thread (thread chain)
          this.simpleScheduler.scheduleThreadChain(thread.tweets, scheduleTime, taskId);
          if (isImmediate) {
            console.log(`🚀 IMMEDIATE: Thread chain "${thread.title}" (catch-up for ${missedSlots[immediateCount-1]}:00)`);
          } else {
            console.log(`🧵 Scheduled thread chain "${thread.title}" for ${scheduleTime.toLocaleString('id-ID')}`);
          }
        } else {
          // Single thread
          this.simpleScheduler.scheduleThread(thread.tweets[0], scheduleTime, taskId);
          if (isImmediate) {
            console.log(`🚀 IMMEDIATE: Thread "${thread.title}" (catch-up for ${missedSlots[immediateCount-1]}:00)`);
          } else {
            console.log(`📝 Scheduled thread "${thread.title}" for ${scheduleTime.toLocaleString('id-ID')}`);
          }
        }
        
        scheduled++;
        
        // Move to next slot (only for non-immediate posts)
        if (!isImmediate) {
          if (currentDay === 0 && currentSlot < upcomingSlots.length - 1) {
            currentSlot++;
          } else if (currentDay === 0) {
            // Move to next day
            currentDay = 1;
            currentSlot = 0;
          } else {
            currentSlot++;
            if (currentSlot >= dailyHours.length) {
              currentSlot = 0;
              currentDay++;
            }
          }
        }
        
      } catch (error) {
        console.log(`❌ Error scheduling thread "${thread.title}": ${error.message}`);
        skipped++;
      }
    }
    
    console.log(`\n✅ Smart scheduling completed!`);
    console.log(`📊 Successfully scheduled: ${scheduled} threads`);
    if (skipped > 0) {
      console.log(`⚠️  Skipped: ${skipped} threads due to errors`);
    }
    
    console.log('\n� Summary:');
    if (immediateCount > 0) {
      console.log(`� Immediate catch-up posts: ${immediateCount} (starting in 30 seconds)`);
    }
    console.log(`📅 Regular scheduled posts: ${scheduled - immediateCount}`);
    console.log(`⏰ Times: 06:00, 09:00, 12:00, 15:00, 18:00, 20:00`);
    console.log(`📊 Use "Check Status" to monitor all scheduled tasks`);
  }

  /**
   * Schedule all threads from CSV
   */
  async scheduleAllThreadsFromCSV(threads) {
    console.log('\n📅 Scheduling all threads from CSV...');
    
    const startTime = await this.askQuestion('Enter start time (HH:MM): ');
    const intervalMinutes = await this.askQuestion('Interval between posts (minutes): ');
    
    if (!/^\d{1,2}:\d{2}$/.test(startTime)) {
      console.log('❌ Invalid time format. Use HH:MM');
      return;
    }
    
    const interval = parseInt(intervalMinutes);
    if (isNaN(interval) || interval < 1) {
      console.log('❌ Invalid interval. Must be at least 1 minute');
      return;
    }
    
    // Parse start time
    const [hours, minutes] = startTime.split(':').map(Number);
    let scheduleTime = new Date();
    scheduleTime.setHours(hours, minutes, 0, 0);
    
    // If time is in the past today, schedule for tomorrow
    if (scheduleTime <= new Date()) {
      scheduleTime.setDate(scheduleTime.getDate() + 1);
    }
    
    console.log(`\n⏰ Scheduling ${threads.length} threads starting from ${scheduleTime.toLocaleString('id-ID')}`);
    
    let scheduled = 0;
    for (const thread of threads) {
      const taskId = `csv-thread-${thread.id}-${Date.now()}`;
      
      if (thread.tweets.length > 1) {
        // Multi-part thread (thread chain)
        this.simpleScheduler.scheduleThreadChain(thread.tweets, scheduleTime, taskId);
        console.log(`🧵 Scheduled thread chain "${thread.title}" for ${scheduleTime.toLocaleString('id-ID')}`);
      } else {
        // Single thread
        this.simpleScheduler.scheduleThread(thread.tweets[0], scheduleTime, taskId);
        console.log(`📝 Scheduled thread "${thread.title}" for ${scheduleTime.toLocaleString('id-ID')}`);
      }
      
      scheduled++;
      
      // Add interval for next thread
      scheduleTime = new Date(scheduleTime.getTime() + (interval * 60 * 1000));
    }
    
    console.log(`\n✅ Successfully scheduled ${scheduled} threads!`);
    console.log('📊 Use "Check Status" to monitor scheduled tasks');
    
    // Show next post info
    const nextTask = this.simpleScheduler.getNextScheduledTask();
    if (nextTask) {
      const now = new Date();
      const timeLeft = nextTask.scheduleTime.getTime() - now.getTime();
      
      if (timeLeft > 0) {
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        const timeString = hoursLeft > 0 
          ? `${hoursLeft}h ${minutesLeft}m` 
          : `${minutesLeft}m`;
        
        console.log(`\n⏰ Next post: ${nextTask.scheduleTime.toLocaleString('id-ID')} (in ${timeString})`);
        console.log(`📝 Type: ${nextTask.type === 'chain' ? 'Thread Chain' : 'Single Thread'}`);
      }
    }
  }

  /**
   * Schedule specific threads
   */
  async scheduleSpecificThreads(threads) {
    console.log('\n🎯 Schedule Specific Threads');
    
    // Show available threads
    console.log('\nAvailable threads:');
    threads.forEach(thread => {
      console.log(`${thread.id}. ${thread.title || 'No title'} (${thread.tweets.length} posts)`);
    });
    
    const threadIds = await this.askQuestion('\nEnter thread IDs (comma-separated): ');
    const ids = threadIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    
    if (ids.length === 0) {
      console.log('❌ No valid thread IDs provided');
      return;
    }
    
    const scheduleTime = await this.askQuestion('Enter schedule time (HH:MM): ');
    if (!/^\d{1,2}:\d{2}$/.test(scheduleTime)) {
      console.log('❌ Invalid time format. Use HH:MM');
      return;
    }
    
    // Parse time
    const [hours, minutes] = scheduleTime.split(':').map(Number);
    let time = new Date();
    time.setHours(hours, minutes, 0, 0);
    
    if (time <= new Date()) {
      time.setDate(time.getDate() + 1);
    }
    
    let scheduled = 0;
    for (const id of ids) {
      const thread = threads.find(t => t.id === id);
      if (thread) {
        const taskId = `specific-thread-${id}-${Date.now()}`;
        
        if (thread.tweets.length > 1) {
          this.simpleScheduler.scheduleThreadChain(thread.tweets, time, taskId);
        } else {
          this.simpleScheduler.scheduleThread(thread.tweets[0], time, taskId);
        }
        
        console.log(`✅ Scheduled "${thread.title}" for ${time.toLocaleString('id-ID')}`);
        scheduled++;
        
        // Add 2 minutes interval between threads
        time = new Date(time.getTime() + (2 * 60 * 1000));
      }
    }
    
    console.log(`\n✅ Successfully scheduled ${scheduled} threads!`);
    
    // Show next post info
    const nextTask = this.simpleScheduler.getNextScheduledTask();
    if (nextTask) {
      const now = new Date();
      const timeLeft = nextTask.scheduleTime.getTime() - now.getTime();
      
      if (timeLeft > 0) {
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        const timeString = hoursLeft > 0 
          ? `${hoursLeft}h ${minutesLeft}m` 
          : `${minutesLeft}m`;
        
        console.log(`\n⏰ Next post: ${nextTask.scheduleTime.toLocaleString('id-ID')} (in ${timeString})`);
        console.log(`📝 Type: ${nextTask.type === 'chain' ? 'Thread Chain' : 'Single Thread'}`);
      }
    }
  }

  /**
   * Quick schedule next 3 threads
   */
  async quickScheduleThreads(threads) {
    console.log('\n⚡ Quick Schedule - Next 3 Threads');
    
    const threadsToSchedule = threads.slice(0, 3);
    let scheduleTime = new Date();
    scheduleTime.setMinutes(scheduleTime.getMinutes() + 1); // Start in 1 minute
    
    console.log('📋 Will schedule:');
    threadsToSchedule.forEach((thread, index) => {
      const time = new Date(scheduleTime.getTime() + (index * 5 * 60 * 1000)); // 5 minutes apart
      console.log(`${index + 1}. "${thread.title}" at ${time.toLocaleString('id-ID')}`);
    });
    
    const confirm = await this.askQuestion('\nProceed with quick scheduling? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('❌ Quick scheduling cancelled');
      return;
    }
    
    let scheduled = 0;
    for (let i = 0; i < threadsToSchedule.length; i++) {
      const thread = threadsToSchedule[i];
      const time = new Date(scheduleTime.getTime() + (i * 5 * 60 * 1000));
      const taskId = `quick-thread-${thread.id}-${Date.now()}`;
      
      if (thread.tweets.length > 1) {
        this.simpleScheduler.scheduleThreadChain(thread.tweets, time, taskId);
      } else {
        this.simpleScheduler.scheduleThread(thread.tweets[0], time, taskId);
      }
      
      scheduled++;
    }
    
    console.log(`\n✅ Quick scheduled ${scheduled} threads!`);
    
    // Show next post info
    const nextTask = this.simpleScheduler.getNextScheduledTask();
    if (nextTask) {
      const now = new Date();
      const timeLeft = nextTask.scheduleTime.getTime() - now.getTime();
      
      if (timeLeft > 0) {
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        const timeString = hoursLeft > 0 
          ? `${hoursLeft}h ${minutesLeft}m` 
          : `${minutesLeft}m`;
        
        console.log(`\n⏰ Next post: ${nextTask.scheduleTime.toLocaleString('id-ID')} (in ${timeString})`);
        console.log(`📝 First post in: ${timeString}`);
      }
    }
  }

  /**
   * Schedule thread chains specifically
   */
  async scheduleThreadChains(threads) {
    console.log('\n🧵 Schedule Thread Chains');
    
    // Filter threads with multiple parts
    const threadChains = threads.filter(t => t.tweets.length > 1);
    
    if (threadChains.length === 0) {
      console.log('📭 No thread chains found (threads with multiple parts)');
      console.log('💡 Thread chains are threads with 2 or more parts/tweets');
      return;
    }
    
    console.log(`\nFound ${threadChains.length} thread chains:`);
    threadChains.forEach(thread => {
      console.log(`${thread.id}. ${thread.title || 'No title'} (${thread.tweets.length} parts)`);
    });
    
    const choice = await this.askQuestion('\nChoose: 1) Schedule all chains, 2) Select specific chains: ');
    
    let chainsToSchedule = [];
    if (choice === '1') {
      chainsToSchedule = threadChains;
    } else if (choice === '2') {
      const ids = await this.askQuestion('Enter chain IDs (comma-separated): ');
      const selectedIds = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      chainsToSchedule = threadChains.filter(t => selectedIds.includes(t.id));
    } else {
      console.log('❌ Invalid choice');
      return;
    }
    
    if (chainsToSchedule.length === 0) {
      console.log('❌ No thread chains selected');
      return;
    }
    
    const startTime = await this.askQuestion('Enter start time (HH:MM): ');
    if (!/^\d{1,2}:\d{2}$/.test(startTime)) {
      console.log('❌ Invalid time format. Use HH:MM');
      return;
    }
    
    const [hours, minutes] = startTime.split(':').map(Number);
    let scheduleTime = new Date();
    scheduleTime.setHours(hours, minutes, 0, 0);
    
    if (scheduleTime <= new Date()) {
      scheduleTime.setDate(scheduleTime.getDate() + 1);
    }
    
    console.log(`\n🧵 Scheduling ${chainsToSchedule.length} thread chains...`);
    
    let scheduled = 0;
    for (const chain of chainsToSchedule) {
      const taskId = `chain-${chain.id}-${Date.now()}`;
      this.simpleScheduler.scheduleThreadChain(chain.tweets, scheduleTime, taskId);
      
      console.log(`✅ Scheduled chain "${chain.title}" (${chain.tweets.length} parts) for ${scheduleTime.toLocaleString('id-ID')}`);
      scheduled++;
      
      // Add 10 minutes between chain postings
      scheduleTime = new Date(scheduleTime.getTime() + (10 * 60 * 1000));
    }
    
    console.log(`\n✅ Successfully scheduled ${scheduled} thread chains!`);
    
    // Show next post info
    const nextTask = this.simpleScheduler.getNextScheduledTask();
    if (nextTask) {
      const now = new Date();
      const timeLeft = nextTask.scheduleTime.getTime() - now.getTime();
      
      if (timeLeft > 0) {
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        const timeString = hoursLeft > 0 
          ? `${hoursLeft}h ${minutesLeft}m` 
          : `${minutesLeft}m`;
        
        console.log(`\n⏰ Next post: ${nextTask.scheduleTime.toLocaleString('id-ID')} (in ${timeString})`);
        console.log(`📝 Type: ${nextTask.type === 'chain' ? 'Thread Chain' : 'Single Thread'}`);
      }
    }
  }

  /**
   * Schedule individual thread
   */
  async scheduleIndividualThread() {
    console.log('\n📝 Schedule Individual Thread');
    
    try {
      const threads = await this.csvClient.getThreadData();
      
      if (threads.length === 0) {
        console.log('📭 No threads found');
        console.log('💡 Load a CSV file first');
        return;
      }

      // Show available threads
      console.log('\nAvailable threads:');
      threads.forEach(thread => {
        console.log(`${thread.id}. ${thread.title || 'No title'} (${thread.tweets.length} posts)`);
      });

      const threadId = await this.askQuestion('\nEnter thread ID: ');
      const id = parseInt(threadId);
      
      const thread = threads.find(t => t.id === id);
      if (!thread) {
        console.log('❌ Thread not found');
        return;
      }

      console.log('\n⏰ Schedule Options:');
      console.log('1. In 1 minute');
      console.log('2. In 5 minutes');
      console.log('3. In 1 hour');
      console.log('4. Custom time (HH:MM)');
      
      const option = await this.askQuestion('\nChoose scheduling option (1-4): ');
      
      let taskId;
      const baseId = `individual-${id}-${Date.now()}`;
      
      switch (option) {
        case '1':
          if (thread.tweets.length > 1) {
            taskId = this.simpleScheduler.quickSchedule.chainIn1Minute(thread.tweets, baseId);
          } else {
            taskId = this.simpleScheduler.quickSchedule.in1Minute(thread.tweets[0], baseId);
          }
          console.log('✅ Scheduled for 1 minute from now');
          break;
          
        case '2':
          if (thread.tweets.length > 1) {
            taskId = this.simpleScheduler.quickSchedule.chainIn5Minutes(thread.tweets, baseId);
          } else {
            taskId = this.simpleScheduler.quickSchedule.in5Minutes(thread.tweets[0], baseId);
          }
          console.log('✅ Scheduled for 5 minutes from now');
          break;
          
        case '3':
          if (thread.tweets.length > 1) {
            const time = new Date();
            time.setHours(time.getHours() + 1);
            taskId = this.simpleScheduler.scheduleThreadChain(thread.tweets, time, baseId);
          } else {
            taskId = this.simpleScheduler.quickSchedule.in1Hour(thread.tweets[0], baseId);
          }
          console.log('✅ Scheduled for 1 hour from now');
          break;
          
        case '4':
          const customTime = await this.askQuestion('Enter time (HH:MM): ');
          if (!/^\d{1,2}:\d{2}$/.test(customTime)) {
            console.log('❌ Invalid time format');
            return;
          }
          
          const [hours, minutes] = customTime.split(':').map(Number);
          const scheduleTime = new Date();
          scheduleTime.setHours(hours, minutes, 0, 0);
          
          if (scheduleTime <= new Date()) {
            scheduleTime.setDate(scheduleTime.getDate() + 1);
          }
          
          if (thread.tweets.length > 1) {
            taskId = this.simpleScheduler.scheduleThreadChain(thread.tweets, scheduleTime, baseId);
          } else {
            taskId = this.simpleScheduler.scheduleThread(thread.tweets[0], scheduleTime, baseId);
          }
          
          console.log(`✅ Scheduled for ${scheduleTime.toLocaleString('id-ID')}`);
          break;
          
        default:
          console.log('❌ Invalid option');
          return;
      }
      
      console.log(`📋 Task ID: ${taskId}`);
      console.log('💡 Use "Check Status" to monitor this task');
      
      // Show next post info
      const nextTask = this.simpleScheduler.getNextScheduledTask();
      if (nextTask) {
        const now = new Date();
        const timeLeft = nextTask.scheduleTime.getTime() - now.getTime();
        
        if (timeLeft > 0) {
          const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
          const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          
          const timeString = hoursLeft > 0 
            ? `${hoursLeft}h ${minutesLeft}m` 
            : `${minutesLeft}m`;
          
          console.log(`\n⏰ Next post: ${nextTask.scheduleTime.toLocaleString('id-ID')} (in ${timeString})`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Failed to schedule thread: ${error.message}`);
    }
  }

  /**
   * Quick test: Schedule 1 thread in 30 seconds
   */
  async quickTestScheduler() {
    console.log('\n⚡ Quick Test: Schedule 1 Thread in 30 seconds');
    
    try {
      const threads = await this.csvClient.getThreadData();
      
      if (threads.length === 0) {
        console.log('📭 No threads found');
        console.log('💡 Load a CSV file first using "Load CSV File" option');
        return;
      }

      // Check if we have an existing logged-in bot
      if (this.threadsBot && this.threadsBot.isLoggedIn) {
        console.log('✅ Using existing logged-in bot session');
        this.simpleScheduler.setBot(this.threadsBot);
      } else {
        console.log('⚠️  No logged-in bot found');
        console.log('🔧 Please use "5. Manual Login to Threads" first');
        return;
      }

      // Use first thread for testing
      const testThread = threads[0];
      const now = new Date();
      const scheduleTime = new Date(now.getTime() + 30000); // 30 seconds from now
      
      console.log(`\n🧪 Test Details:`);
      console.log(`Thread: "${testThread.title}"`);
      console.log(`Content: "${testThread.tweets[0]?.substring(0, 60)}..."`);
      console.log(`Schedule: ${scheduleTime.toLocaleString('id-ID')}`);
      console.log(`Type: ${testThread.tweets.length > 1 ? 'Thread Chain' : 'Single Thread'}`);
      
      const confirm = await this.askQuestion('\nProceed with quick test? (y/n): ');
      if (confirm.toLowerCase() !== 'y') {
        console.log('❌ Quick test cancelled');
        return;
      }

      const taskId = `quick-test-${Date.now()}`;
      
      if (testThread.tweets.length > 1) {
        this.simpleScheduler.scheduleThreadChain(testThread.tweets, scheduleTime, taskId);
        console.log('🧵 Thread chain scheduled for quick test');
      } else {
        this.simpleScheduler.scheduleThread(testThread.tweets[0], scheduleTime, taskId);
        console.log('📝 Single thread scheduled for quick test');
      }

      console.log(`\n✅ Quick test scheduled!`);
      console.log(`📋 Task ID: ${taskId}`);
      console.log(`⏰ Will execute in 30 seconds`);
      console.log('👀 Watch the browser for automatic posting');
      
      // Show next scheduled post info after quick test
      this.simpleScheduler.showNextPostInfo();
      
    } catch (error) {
      console.log(`❌ Failed to setup quick test: ${error.message}`);
    }
  }
  async switchSchedulerType() {
    console.log('\n⚙️ Switch Scheduler Type');
    console.log('='.repeat(40));
    console.log('1. 🚀 Smart Scheduler (SimpleScheduler) - Recommended');
    console.log('   - Uses setTimeout for precise timing');
    console.log('   - Better thread chain support');
    console.log('   - More reliable and flexible');
    console.log('');
    console.log('2. ⏰ Traditional Scheduler (Cron-based)');
    console.log('   - Uses cron jobs for scheduling');
    console.log('   - Good for regular intervals');
    console.log('   - CSV time-based scheduling');
    
    const choice = await this.askQuestion('\nChoose scheduler type (1 or 2): ');
    
    if (choice === '1') {
      this.schedulerType = 'simple';
      console.log('✅ Switched to Smart Scheduler (SimpleScheduler)');
    } else if (choice === '2') {
      this.schedulerType = 'cron';
      console.log('✅ Switched to Traditional Scheduler (Cron)');
    } else {
      console.log('❌ Invalid choice');
    }
  }

  /**
   * Start scheduler (original method, updated)
   */
  async startScheduler() {
    if (this.schedulerType === 'simple') {
      await this.startSmartScheduler();
    } else {
      await this.startTraditionalScheduler();
    }
  }

  /**
   * Start traditional scheduler
   */
  async startTraditionalScheduler() {
    console.log('\n⏰ Starting Traditional Scheduler (Cron-based)...');
    
    try {
      await this.scheduler.initialize();
      this.scheduler.start();
      console.log('✅ Traditional Scheduler started successfully!');
      console.log('📊 Threads will be posted according to CSV schedule');
      
    } catch (error) {
      console.log(`❌ Failed to start Traditional Scheduler: ${error.message}`);
    }
  }

  /**
   * Post a thread manually
   */
  async postThreadManually() {
    console.log('\n📝 Manual thread posting...');
    
    try {
      // Use CSV client instead of Google Sheets
      const threads = await this.csvClient.getThreadData();
      
      if (threads.length === 0) {
        console.log('📭 No threads found');
        console.log('💡 Load a CSV file first using "Load CSV File" option');
        return;
      }

      // Show available threads
      console.log('\nAvailable threads:');
      threads.forEach(thread => {
        console.log(`${thread.id}. ${thread.title || 'No title'} (${thread.tweets.length} posts)`);
      });

      const threadId = await this.askQuestion('\nEnter thread ID to post: ');
      const id = parseInt(threadId);
      
      if (isNaN(id) || !threads.find(t => t.id === id)) {
        console.log('❌ Invalid thread ID');
        return;
      }

      console.log('🔍 Checking login status...');
      
      // Check if main bot is logged in first (from manual login)
      if (this.threadsBot && this.threadsBot.isLoggedIn) {
        console.log('🚀 Using existing session to post thread...');
        
        const thread = threads.find(t => t.id === id);
        await this.threadsBot.postThreadChain(thread.tweets, thread.title);
        console.log('✅ Thread posted successfully!');
        return;
      }
      
      // Check if scheduler's bot is logged in
      if (!this.scheduler.threadsBot.isLoggedIn) {
        console.log('⚠️  You need to login to Threads first!');
        console.log('🔧 Please use "3. Manual Login" option first, then try again.');
        return;
      }

      console.log('🚀 Posting thread via scheduler...');
      await this.scheduler.postThreadNow(id);
      console.log('✅ Thread posted successfully!');
      
    } catch (error) {
      console.log(`❌ Failed to post thread: ${error.message}`);
      
      if (error.message.includes('Not logged in')) {
        console.log('💡 Tip: Use "3. Manual Login" first, then try posting again.');
      }
    }
  }

  /**
   * Check status
   */
  async checkStatus() {
    console.log('\n📊 Checking status...');
    
    try {
      console.log('\n' + '='.repeat(50));
      console.log('📊 SYSTEM STATUS');
      console.log('='.repeat(50));
      
      // Show scheduler type
      console.log(`⚙️  Active Scheduler: ${this.schedulerType === 'simple' ? '🚀 Smart (SimpleScheduler)' : '⏰ Traditional (Cron)'}`);
      
      if (this.schedulerType === 'simple') {
        // SimpleScheduler status
        const scheduledTasks = this.simpleScheduler.listScheduledTasks();
        
        console.log(`📋 Scheduled Tasks: ${scheduledTasks.length}`);
        console.log(`🔐 Login Status: ${this.simpleScheduler.bot?.isLoggedIn ? '✅ Logged in' : '❌ Not logged in'}`);
        
        if (scheduledTasks.length > 0) {
          console.log('\n📅 UPCOMING SCHEDULED TASKS:');
          console.log('-'.repeat(80));
          
          // Sort tasks by schedule time
          scheduledTasks.sort((a, b) => a.scheduleTime - b.scheduleTime);
          
          scheduledTasks.forEach((task, index) => {
            const timeLeft = task.scheduleTime.getTime() - new Date().getTime();
            const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            
            console.log(`${index + 1}. Task ID: ${task.id}`);
            console.log(`   Type: ${task.type === 'chain' ? '🧵 Thread Chain' : '� Single Thread'}`);
            console.log(`   Schedule: ${task.scheduleTime.toLocaleString('id-ID')}`);
            
            if (timeLeft > 0) {
              console.log(`   Time Left: ${hoursLeft}h ${minutesLeft}m`);
            } else {
              console.log(`   Status: ⚠️ Overdue`);
            }
            
            if (task.type === 'chain' && task.content) {
              console.log(`   Parts: ${task.content.length}`);
              console.log(`   Preview: ${task.content[0]?.substring(0, 60)}...`);
            } else if (task.content) {
              console.log(`   Preview: ${task.content.substring(0, 60)}...`);
            }
            console.log('');
          });
        } else {
          console.log('\n📭 No scheduled tasks');
          console.log('💡 Use "Start Smart Scheduler" to schedule threads');
        }
        
      } else {
        // Traditional scheduler status
        const status = await this.scheduler.getStatus();
        
        console.log(`🔄 Scheduler Running: ${status.isRunning ? '✅ Yes' : '❌ No'}`);
        console.log(`🔐 Threads Login: ${status.isLoggedIn ? '✅ Logged in' : '❌ Not logged in'}`);
        console.log(`📊 Total Threads: ${status.totalThreads || 0}`);
        console.log(`📅 Scheduled Threads: ${status.scheduledThreads || 0}`);
        console.log(`📤 Posted Today: ${status.postedToday || 0}`);
        
        if (status.upcomingThreads && status.upcomingThreads.length > 0) {
          console.log('\n📅 UPCOMING THREADS:');
          status.upcomingThreads.forEach(thread => {
            console.log(`• ${thread.title} (${thread.tweetCount} posts) - ${thread.scheduledTime}`);
          });
        }
      }

      // Show main bot status if available
      if (this.threadsBot && this.threadsBot.isLoggedIn) {
        console.log(`\n🤖 Main Bot Status: ✅ Logged in`);
      }

      // Show data source info
      const csvInfo = this.csvClient.getCurrentCSVInfo();
      if (csvInfo.filename) {
        console.log(`\n📄 Data Source: ${csvInfo.filename} (${csvInfo.threadsCount} threads loaded)`);
      } else {
        console.log(`\n📄 Data Source: ❌ No CSV loaded`);
      }
      
    } catch (error) {
      console.log(`❌ Failed to get status: ${error.message}`);
    }
  }

  /**
   * Stop scheduler
   */
  async stopScheduler() {
    console.log('\n⏹️ Stopping scheduler...');
    
    try {
      if (this.schedulerType === 'simple') {
        // Stop SimpleScheduler
        const scheduledTasks = this.simpleScheduler.listScheduledTasks();
        
        if (scheduledTasks.length === 0) {
          console.log('📭 No scheduled tasks to stop');
          return;
        }
        
        console.log(`🛑 Found ${scheduledTasks.length} scheduled tasks`);
        
        const confirm = await this.askQuestion('Stop all scheduled tasks? (y/n): ');
        if (confirm.toLowerCase() === 'y') {
          this.simpleScheduler.stopAllTasks();
          console.log('✅ All scheduled tasks stopped');
        } else {
          // Show tasks and allow selective stopping
          console.log('\nScheduled tasks:');
          scheduledTasks.forEach((task, index) => {
            console.log(`${index + 1}. ${task.id} - ${task.scheduleTime.toLocaleString('id-ID')}`);
          });
          
          const taskSelection = await this.askQuestion('Enter task numbers to stop (comma-separated) or "all": ');
          
          if (taskSelection.toLowerCase() === 'all') {
            this.simpleScheduler.stopAllTasks();
            console.log('✅ All scheduled tasks stopped');
          } else {
            const indices = taskSelection.split(',').map(i => parseInt(i.trim()) - 1);
            let stopped = 0;
            
            indices.forEach(index => {
              if (index >= 0 && index < scheduledTasks.length) {
                const task = scheduledTasks[index];
                const success = this.simpleScheduler.cancelScheduledTask(task.id);
                if (success) {
                  console.log(`✅ Stopped task: ${task.id}`);
                  stopped++;
                }
              }
            });
            
            console.log(`✅ Stopped ${stopped} tasks`);
          }
        }
        
      } else {
        // Stop traditional scheduler
        this.scheduler.stop();
        console.log('✅ Traditional Scheduler stopped');
      }
      
    } catch (error) {
      console.log(`❌ Failed to stop scheduler: ${error.message}`);
    }
  }

  /**
   * Cleanup and exit
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    try {
      // Stop both schedulers
      if (this.schedulerType === 'simple') {
        await this.simpleScheduler.shutdown();
      } else {
        this.scheduler.stop();
        await this.scheduler.cleanup();
      }
      
      if (this.threadsBot) {
        await this.threadsBot.close();
      }
      
      this.rl.close();
      console.log('👋 Goodbye!');
      process.exit(0);
      
    } catch (error) {
      console.log(`❌ Cleanup error: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Main application loop
   */
  async run() {
    try {
      logger.info('Starting Threads Bot Application...');
      
      while (true) {
        this.showMenu();
        const choice = await this.askQuestion('\n🎯 Choose an option (1-14): ');

        switch (choice) {
          case '1':
            await this.listCSVFiles();
            break;
          case '2':
            await this.loadCSVFile();
            break;
          case '3':
            await this.createSampleCSV();
            break;
          case '4':
            await this.viewCurrentCSVData();
            break;
          case '5':
            await this.manualLogin();
            break;
          case '6':
            await this.postThreadManually();
            break;
          case '7':
            await this.startSmartScheduler();
            break;
          case '8':
            await this.scheduleIndividualThread();
            break;
          case '9':
            await this.quickTestScheduler();
            break;
          case '10':
            await this.checkStatus();
            break;
          case '11':
            await this.stopScheduler();
            break;
          case '12':
            await this.testConnection();
            break;
          case '13':
            await this.switchSchedulerType();
            break;
          case '14':
            await this.cleanup();
            return;
          default:
            console.log('❌ Invalid option. Please choose 1-14.');
        }

        if (choice !== '14') {
          await this.askQuestion('\n⏳ Press Enter to continue...');
        }
      }
    } catch (error) {
      logger.error('Application error:', error);
      console.log(`❌ Application error: ${error.message}`);
      await this.cleanup();
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Received interrupt signal...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n🛑 Received terminate signal...');
  process.exit(0);
});

// Start the application
if (require.main === module) {
  const app = new ThreadsBotApp();
  app.run().catch(error => {
    logger.error('Failed to start application:', error);
    console.error('Failed to start application:', error.message);
    process.exit(1);
  });
}

module.exports = ThreadsBotApp;
