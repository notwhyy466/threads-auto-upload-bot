# Google Sheets Setup Guide

This guide will help you set up Google Sheets integration for the Threads Auto Posting Bot.

## 📋 Prerequisites

- Google Account
- Google Cloud Console access
- Google Sheets API enabled

## 🚀 Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 2. Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in service account details:
   - Name: `threads-bot-service`
   - Description: `Service account for Threads posting bot`
4. Click "Create and Continue"
5. Skip role assignment (click "Continue")
6. Click "Done"

### 3. Generate API Key

1. Find your service account in the credentials list
2. Click on the service account email
3. Go to "Keys" tab
4. Click "Add Key" > "Create New Key"
5. Choose "JSON" format
6. Download the JSON file

### 4. Setup Project Files

1. **Place credentials file:**
   ```
   mkdir config
   mv downloaded-file.json config/google-credentials.json
   ```

2. **Update .env file:**
   ```env
   GOOGLE_SHEETS_ENABLED=true
   GOOGLE_APPLICATION_CREDENTIALS=./config/google-credentials.json
   SPREADSHEET_ID=your_spreadsheet_id_here
   ```

### 5. Create Google Sheet

1. Create a new Google Sheet
2. Share it with your service account email (found in JSON file)
3. Give "Editor" permission
4. Copy the spreadsheet ID from URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```

### 6. Setup Sheet Format

Create columns in your Google Sheet:

| id | title | tweet1 | tweet2 | tweet3 | tweet4 | tweet5 | scheduledTime |
|----|-------|--------|--------|--------|--------|--------|---------------|
| 1 | "First Thread" | "Post 1 content" | "Post 2 content" | "" | "" | "" | "14:30" |
| 2 | "Single Post" | "Single post content" | "" | "" | "" | "" | "16:00" |

## 🔧 Configuration

Update `config/config.js`:

```javascript
module.exports = {
  googleSheets: {
    enabled: process.env.GOOGLE_SHEETS_ENABLED === 'true',
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    spreadsheetId: process.env.SPREADSHEET_ID,
    sheetName: 'Threads' // Default sheet name
  }
};
```

## ✅ Testing

Test your setup:

```bash
npm test
```

If successful, you should see:
```
✅ Google Sheets: Connected
✅ Data loaded: X threads found
```

## 🚨 Troubleshooting

### Common Issues:

1. **"Credentials not found"**
   - Check file path in .env
   - Ensure JSON file exists
   - Verify file permissions

2. **"Permission denied"**
   - Share sheet with service account email
   - Give "Editor" permission
   - Check spreadsheet ID

3. **"API not enabled"**
   - Enable Google Sheets API in Cloud Console
   - Wait a few minutes for propagation

4. **"Invalid spreadsheet ID"**
   - Copy ID from sheet URL
   - Ensure no extra characters
   - Check sharing permissions

## 📖 Alternative: Use CSV Files

If you prefer not to use Google Sheets, the bot supports CSV files:

1. Place CSV files in `data/csv/` folder
2. Use menu option "2. Load CSV File"
3. Set `GOOGLE_SHEETS_ENABLED=false` in .env

---

**Note**: Google Sheets integration is optional. The bot works perfectly with CSV files alone.
