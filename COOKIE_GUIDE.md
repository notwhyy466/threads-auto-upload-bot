# 🍪 Cookie-Based Authentication Guide

This document explains how to use the cookie-based authentication system in the Threads Auto-Upload Bot.

## 🔄 How It Works

The bot can save your login session as cookies and reuse them for future logins, making the authentication process much faster and more convenient.

## 🚀 Quick Start

### First Time Setup
1. Run the bot: `npm start`
2. Choose option **"6. Smart Login (Cookies + Manual)"**
3. Login manually in the browser when prompted
4. ✅ Cookies are automatically saved for future use!

### Subsequent Uses
1. Run the bot: `npm start`
2. Choose option **"6. Smart Login"** or **"14. Login with Cookies"**
3. ⚡ Login happens instantly using saved cookies!

## 📋 Cookie Management Options

### Option 6: Smart Login (Recommended)
- **What it does**: Tries cookie login first, falls back to manual login if needed
- **When to use**: Every time you want to login
- **Benefits**: Always works, automatically updates cookies

### Option 13: Save Current Cookies
- **What it does**: Saves your current browser session as cookies
- **When to use**: After successful manual login
- **Benefits**: Ensures fresh cookies are saved

### Option 14: Login with Cookies
- **What it does**: Uses only saved cookies to login
- **When to use**: When you know cookies are fresh and valid
- **Benefits**: Fastest login method

### Option 15: View Cookie Info
- **What it does**: Shows information about saved cookies
- **Shows**: Cookie count, save date, age, validity status
- **Benefits**: Check if cookies need refreshing

### Option 16: Delete Saved Cookies
- **What it does**: Removes all saved cookies
- **When to use**: When cookies are corrupted or you want fresh login
- **Benefits**: Forces clean manual login

## 🔧 Testing Cookie System

Run the cookie test script:
```bash
npm run test:cookies
```

This will:
1. Check for existing cookies
2. Test cookie-based login
3. Test smart login system
4. Save fresh cookies
5. Show cookie status

## 📁 Cookie Storage

- **Location**: `data/threads-cookies.json`
- **Security**: File is excluded from git commits
- **Format**: JSON with cookie data and metadata
- **Expiry**: Cookies typically last 30 days

## ⚠️ Important Notes

### Cookie Security
- **Never share** your cookie file with others
- Cookies contain your login session data
- File is automatically excluded from git commits

### Cookie Expiration
- Cookies typically expire after 30 days
- Smart Login automatically handles expired cookies
- Use "View Cookie Info" to check cookie age

### Troubleshooting
- If cookie login fails, use Smart Login (option 6)
- Delete cookies and login fresh if having persistent issues
- Check cookie info to see if cookies are too old

## 🔄 Best Practices

1. **Always use Smart Login** - It handles all scenarios automatically
2. **Check cookie status periodically** - View cookie info monthly
3. **Let the system auto-save** - Cookies save automatically after manual login
4. **Don't manually edit** cookie files
5. **Delete cookies if switching accounts**

## 🛠️ Advanced Usage

### Cookie File Structure
```json
{
  "cookies": [...],      // Array of cookie objects
  "savedAt": "2024-01-01T12:00:00.000Z",  // Save timestamp
  "domain": "threads.net"  // Target domain
}
```

### Manual Cookie Operations
```javascript
const bot = new ThreadsBot();
await bot.initialize();

// Check if cookies exist
if (bot.getCookieInfo()) {
  // Try cookie login
  const success = await bot.loginWithCookies();
}

// Save current session
await bot.saveCookies();
```

## 🆘 Common Issues

### "Cookie login failed"
- **Cause**: Cookies expired or invalid
- **Solution**: Use Smart Login (option 6) instead

### "No saved cookies found"
- **Cause**: No previous login session saved
- **Solution**: Use Manual Login (option 5) or Smart Login (option 6)

### "Cookies are over 30 days old"
- **Cause**: Old cookies may not work
- **Solution**: Delete cookies and login fresh

### Login still requires manual interaction
- **Cause**: Threads may require periodic manual verification
- **Solution**: This is normal security behavior from Threads
