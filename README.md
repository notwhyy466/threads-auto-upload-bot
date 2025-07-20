# 🧵 Threads Auto-Upload Bot

A powerful automation bot for posting content to Threads (Meta) with smart scheduling, CSV integration, and cookie-based authentication.

![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)

## ✨ Features

- 🍪 **Cookie-Based Authentication**: Fast login using saved session cookies
- 🧠 **Smart Login System**: Automatic fallback from cookies to manual login
- 🔐 **Manual Login with Session Saving**: Login once manually, save session for future use
- 📊 **CSV Integration**: Load thread content from CSV/Excel files
- 🚀 **Smart Scheduling**: Multiple scheduling options with automatic timing
- 🧵 **Thread Chains**: Support for multi-part connected threads
- 💾 **Session Management**: Persistent login sessions with cookie storage
- 🛡️ **Safe Automation**: Minimal resource usage and detection avoidance
- ⚡ **Quick Test Mode**: Test with 30-second scheduling
- 📅 **Daily Scheduling**: Automatic posting at optimal times

## 🍪 Authentication Methods

### 1. Ultimate Login (Recommended) ⭐
- **What it does**: Automatically tries all methods in order
- **Order**: Cookies → Saved Credentials → Environment Variables → Manual Login
- **Benefits**: One-click login that always works

### 2. Terminal Login (Username/Password)
- **What it does**: Enter credentials directly in terminal
- **Storage**: Credentials saved securely for future use
- **Benefits**: No browser interaction needed after first setup

### 3. Cookie-Based Login
- **Fast**: Login in seconds using saved cookies
- **Persistent**: Cookies last up to 30 days
- **Automatic**: Smart fallback to manual login if cookies expire

### 4. Smart Login
- **Hybrid**: Tries cookies first, falls back to manual login
- **Seamless**: Best of both authentication methods
- **Self-updating**: Automatically saves fresh cookies after manual login

### 5. Manual Login
- **Traditional**: Manual browser login process
- **Reliable**: Always works when other methods fail
- **Session Saving**: Automatically saves cookies for future use

## 🔧 Environment Variable Setup

Create a `.env` file in the project root:

```env
# Automatic login credentials (optional)
THREADS_USERNAME=your_username_or_email@example.com
THREADS_PASSWORD=your_password_here

# Alternative names also supported
INSTAGRAM_USERNAME=your_username_or_email@example.com
INSTAGRAM_PASSWORD=your_password_here
```

**Important**: Never commit the `.env` file with real credentials!

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Sample Data
```bash
npm start
# Choose option 3 to create sample CSV
```

### 3. Manual Login
```bash
# Choose option 5 to login to Threads manually
```

### 4. Schedule Posts
```bash
# Choose option 7 for Smart Scheduler
```

## � Project Structure

```
Thread Post Puppeter/
├── index.js              # Main application entry
├── package.json          # Dependencies and scripts
├── config/
│   └── config.js         # Configuration settings
├── src/
│   ├── threads-bot.js    # Threads automation logic
│   ├── scheduler.js      # Traditional cron scheduler
│   ├── simple-scheduler.js # Smart scheduler (recommended)
│   ├── csv-client.js     # CSV/Excel file handler
│   ├── sheets-client.js  # Google Sheets integration
│   └── utils/
│       ├── logger.js     # Logging utilities
│       ├── delay.js      # Timing utilities
│       └── csv-reader.js # CSV parsing utilities
├── data/
│   ├── csv/              # CSV/Excel files
│   └── chrome-profile/   # Browser session data
└── logs/                 # Application logs
```

## ⚙️ Configuration

Create `.env` file in project root:

```env
# Optional: Google Sheets integration
GOOGLE_SHEETS_ID=your_sheet_id
GOOGLE_CLIENT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY=your_private_key

# Chrome configuration (optional)
CHROME_EXECUTABLE_PATH=auto
CHROME_USER_DATA_DIR=./data/chrome-profile
```

## � CSV Format

Create CSV files in `data/csv/` with this format:

```csv
id,title,tweet1,tweet2,tweet3,tweet4,tweet5,scheduledTime
1,"Welcome Thread","Welcome to our community!","This is the second part","Final part of the thread",,,09:00
2,"Tips Thread","Here's tip #1","And tip #2",,,,15:00
3,"Single Post","This is a single post",,,,,"12:00"
```

### CSV Fields:
- **id**: Unique identifier for the thread
- **title**: Thread title (for reference)
- **tweet1-tweet5**: Thread parts (1-5 parts supported)
- **scheduledTime**: Time in HH:MM format (24-hour)

## 🎛️ Usage

### Interactive Menu
```bash
npm start
```

### Available Options:

#### 📁 CSV Management
1. **List Available CSV Files**
2. **Load CSV File**
3. **Create Sample CSV**
4. **View Current CSV Data**

#### 🔐 Login Options
5. **Ultimate Login (All Methods)** ⭐ **RECOMMENDED**
6. **Terminal Login (Username/Password)** - Direct credential input
7. **Smart Login (Cookies + Manual)** - Hybrid approach
8. **Manual Login to Threads** - Traditional browser login

#### 🤖 Bot Operations
9. **Post Thread Manually**
10. **Start Smart Scheduler** ⭐ **RECOMMENDED**
11. **Schedule Individual Thread**
12. **Quick Test: Schedule 1 Thread in 30 seconds**
13. **Check Status**
14. **Stop Scheduler**

#### 🍪 Session Management
15. **Save Current Cookies** - Save session for future logins
16. **Login with Cookies** - Fast login using saved cookies
17. **View Cookie Info** - Check cookie status and age
18. **Delete Saved Cookies** - Clear saved authentication
19. **View Saved Credentials** - Check stored username/info
20. **Delete Saved Credentials** - Clear saved credentials

#### ⚙️ Other Options
21. **Test Connection**
22. **Switch Scheduler Type**
23. **Exit**

### 🔐 Authentication Workflow

#### Method 1: Ultimate Login (Easiest) ⭐
1. Set credentials in `.env` file OR
2. Use Terminal Login once to save credentials
3. Choose **"5. Ultimate Login"** - works automatically!

#### Method 2: Terminal Login
1. Choose **"6. Terminal Login"**
2. Enter username/password when prompted
3. Credentials saved for future use
4. Next time: Use Ultimate Login or Terminal Login again

#### Method 3: Traditional Setup
1. Choose **"7. Smart Login"** or **"8. Manual Login"**
2. Login manually in browser when prompted
3. Cookies automatically saved for future use

### Quick Commands
```bash
# Test cookie functionality
node test-cookie-login.js

# Create sample data
npm run sample

# Clean temporary files
npm run cleanup

# Start application
npm start
```

## 📅 Scheduling Options

### 1. 🚀 Smart Scheduler (Recommended)
- Precise timing with setTimeout
- Thread chain support
- Flexible scheduling options
- Quick test mode

### 2. ⏰ Traditional Scheduler
- Cron-based scheduling
- CSV time integration
- Background processing

### Scheduling Modes:
- **All Threads**: Schedule entire CSV with custom intervals
- **Specific Threads**: Select and schedule individual threads
- **Quick Schedule**: Next 3 threads every 5 minutes
- **Thread Chains**: Multi-part thread scheduling
- **Daily Schedule**: Optimal posting times (06:00, 09:00, 12:00, 15:00, 18:00, 20:00)

## 🧵 Features

### Thread Chains
Post connected multi-part threads with automatic delays between parts:
- 30-second delay between thread parts
- Automatic reply threading
- Chain status monitoring

### Smart Timing
- **Daily posting slots**: 06:00, 09:00, 12:00, 15:00, 18:00, 20:00
- **Catch-up system** for missed posts
- **Customizable intervals** between posts
- **Quick test mode** for immediate testing

### Session Management
- One-time manual login
- Persistent browser sessions
- Automatic session recovery
- Cross-session compatibility

## 🛡️ Safety Features

- Human-like delays between actions (1-3 seconds)
- Browser automation detection avoidance
- Resource-efficient operation
- Comprehensive error handling and recovery
- Session isolation and security

## � Troubleshooting

### Login Issues
1. Use "Manual Login" option first
2. Check Chrome installation
3. Clear browser cache if needed
4. Ensure stable internet connection

### Scheduling Issues
1. Verify CSV format and file location
2. Check system time and timezone
3. Ensure proper login status
4. Monitor logs for detailed errors

### Chrome Issues
1. Close other Chrome instances
2. Update Chrome browser to latest version
3. Check Chrome path in config
4. Verify chrome-profile directory permissions

### Common Solutions
```bash
# Check logs
cat logs/app.log

# Clean chrome profile
npm run cleanup

# Restart with fresh session
rm -rf data/chrome-profile
npm start
```

## 📝 Example Usage

### Basic Workflow:
1. **Setup**: `npm install && npm start`
2. **Create Data**: Option 3 → Create sample CSV
3. **Login**: Option 5 → Manual login to Threads
4. **Schedule**: Option 7 → Smart scheduler
5. **Monitor**: Option 10 → Check status

### Advanced Workflow:
1. **Custom CSV**: Create your own CSV in `data/csv/`
2. **Load Data**: Option 2 → Load your CSV
3. **Quick Test**: Option 9 → Test with 30-second delay
4. **Full Schedule**: Option 7 → Complete scheduling
5. **Monitor**: Option 10 → Track progress

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Setup:
```bash
git clone https://github.com/yourusername/threads-auto-bot.git
cd threads-auto-bot
npm install
npm start
```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This tool is for educational and automation purposes. Please use responsibly and in accordance with:
- Threads' Terms of Service
- Platform usage guidelines
- Applicable laws and regulations

## 🆘 Support

For issues and questions:
1. 📖 Check troubleshooting section above
2. 📋 Review logs in `logs/app.log`
3. 🐛 Create GitHub issue with detailed description
4. 💬 Include error messages and steps to reproduce

## 🚀 Roadmap

- [ ] Web dashboard interface
- [ ] Instagram integration
- [ ] Advanced analytics
- [ ] Team collaboration features
- [ ] Custom scheduling patterns
- [ ] Media file support

---

**Made with ❤️ for the automation community**
