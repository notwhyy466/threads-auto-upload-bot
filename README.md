# 🧵 Threads Auto Posting Bot

Bot otomatis untuk posting ke Threads (Meta) dengan fitur scheduling dan manajemen CSV yang lengkap.

## ✨ Fitur Utama

- **Smart Scheduling**: Scheduling otomatis dengan timing yang presisi
- **CSV Management**: Import dan export data threads dari CSV/Excel
- **Thread Chains**: Support posting thread multi-part
- **Auto Login**: Session login yang persistent
- **Error Recovery**: Auto-retry dan error handling yang robust
- **Next Post Info**: Informasi timing post berikutnya yang detail

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment:**
   - Copy `.env.example` ke `.env`
   - Atur konfigurasi di `config/config.js`

3. **Jalankan bot:**
   ```bash
   npm start
   ```

4. **Login dan setup:**
   - Pilih "5. Manual Login to Threads"
   - Pilih "2. Load CSV File" untuk import data
   - Pilih "7. Start Smart Scheduler" untuk mulai scheduling

## 📋 Available Commands

- `npm start` - Jalankan bot
- `npm run cleanup` - Bersihkan file temporary dan cache
- `npm test` - Test koneksi sistem

## 📁 Struktur Project

```
├── index.js                 # Main application
├── src/
│   ├── threads-bot.js       # Core bot functionality  
│   ├── simple-scheduler.js  # Smart scheduling engine
│   ├── csv-client.js       # CSV/Excel handler
│   └── utils/              # Utilities
├── data/
│   ├── csv/                # CSV/Excel files
│   └── chrome-profile/     # Browser session data
└── config/                 # Configuration files
```

## 💡 Tips Penggunaan

1. **Untuk Posting Otomatis:**
   - Load CSV dengan data threads
   - Gunakan Smart Scheduler untuk scheduling
   - Monitor status dengan "Check Status"

2. **Untuk Testing:**
   - Gunakan "Quick Test" untuk test 1 thread
   - Login manual dulu sebelum scheduling

3. **Maintenance:**
   - Jalankan `npm run cleanup` secara berkala
   - Backup file CSV penting

## 🛠️ Troubleshooting

- **Login Issues**: Gunakan "Manual Login" terlebih dahulu
- **Browser Errors**: Pastikan Chrome terinstall dan updated
- **Memory Issues**: Jalankan `npm run cleanup` untuk bersihkan cache

## 📊 System Requirements

- Node.js 16+ 
- Chrome Browser
- Windows 10/11
- Memory: ~250MB storage space

---

**Version**: 1.0.0 (Optimized & Cleaned)  
**Last Updated**: January 2025
