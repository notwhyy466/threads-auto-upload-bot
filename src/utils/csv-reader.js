const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const logger = require('./logger');

class CSVReader {
  constructor() {
    this.csvFolder = path.join(process.cwd(), 'data', 'csv');
    this.ensureCSVFolder();
  }

  /**
   * Ensure CSV folder exists
   */
  ensureCSVFolder() {
    if (!fs.existsSync(this.csvFolder)) {
      fs.mkdirSync(this.csvFolder, { recursive: true });
      logger.info('Created CSV folder: ' + this.csvFolder);
    }
  }

  /**
   * Get list of available CSV and Excel files
   */
  getAvailableCSVFiles() {
    try {
      const files = fs.readdirSync(this.csvFolder)
        .filter(file => file.endsWith('.csv') || file.endsWith('.xlsx') || file.endsWith('.xls'))
        .map(file => {
          const filePath = path.join(this.csvFolder, file);
          const stats = fs.statSync(filePath);
          const isExcel = file.endsWith('.xlsx') || file.endsWith('.xls');
          return {
            name: file,
            nameWithoutExt: file.replace(/\.(csv|xlsx|xls)$/, ''),
            size: stats.size,
            modified: stats.mtime.toISOString().split('T')[0], // YYYY-MM-DD format
            type: isExcel ? 'Excel' : 'CSV'
          };
        });
      
      return files;
    } catch (error) {
      logger.error('Error reading CSV folder:', error);
      return [];
    }
  }

  /**
   * Check if string looks like time format (HH:MM)
   */
  isTimeFormat(str) {
    if (!str || typeof str !== 'string') return false;
    
    // Check for HH:MM format
    const timeRegex = /^\d{1,2}:\d{2}$/;
    return timeRegex.test(str.trim());
  }

  /**
   * Parse CSV content to thread data
   * Expected CSV format:
   * id,title,tweet1,tweet2,tweet3,tweet4,tweet5,scheduledTime
   */
  parseCSVContent(content) {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const threads = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const row = this.parseCSVLine(line);
        
        if (row.length >= 3) { // At least id, title, and one tweet
          const thread = {
            id: parseInt(row[0]) || threads.length + 1,
            title: row[1] || `Thread ${threads.length + 1}`,
            tweets: [],
            scheduledTime: row[row.length - 1] || null
          };

          // Extract tweets (columns 2 to n-1, excluding last column which is scheduledTime)
          const tweetStartIndex = 2;
          const tweetEndIndex = row.length - 1;

          for (let j = tweetStartIndex; j < tweetEndIndex; j++) {
            if (row[j] && row[j].trim().length > 0) {
              thread.tweets.push(row[j].trim());
            }
          }

          // If last column doesn't look like time format, include it as a tweet
          const lastColumn = row[row.length - 1];
          if (lastColumn && !this.isTimeFormat(lastColumn)) {
            thread.tweets.push(lastColumn.trim());
            thread.scheduledTime = null;
          }

          if (thread.tweets.length > 0) {
            threads.push(thread);
            logger.info(`Parsed thread: ${thread.title} (${thread.tweets.length} posts)`);
          }
        }
      } catch (error) {
        logger.warn(`Error parsing CSV line ${i + 1}: ${error.message}`);
      }
    }

    return threads;
  }

  /**
   * Read Excel file and convert to thread data
   */
  readExcelFile(filename) {
    try {
      const filePath = this.getFilePath(filename);
      logger.info(`Reading Excel file: ${filePath}`);

      // Read Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0]; // Use first sheet
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON array format
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      logger.info(`Excel file loaded with ${jsonData.length} rows`);
      
      // Parse Excel data with proper format
      return this.parseExcelData(jsonData);
      
    } catch (error) {
      logger.error(`Error reading Excel file ${filename}:`, error);
      throw new Error(`Failed to read Excel file: ${error.message}`);
    }
  }

  /**
   * Parse Excel data with format: tweet_text, comment_1, comment_2, comment_3, time
   */
  parseExcelData(jsonData) {
    const threads = [];
    
    if (jsonData.length < 2) {
      logger.warn('Excel file has no data rows');
      return threads;
    }

    const headers = jsonData[0];
    logger.info(`Excel headers: ${headers.join(', ')}`);

    // Process each data row (skip header)
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      if (!row || row.length < 4) {
        continue; // Skip incomplete rows
      }

      try {
        const thread = {
          id: i, // Use row number as ID
          title: `Thread ${i}`,
          tweets: [],
          scheduledTime: null
        };

        // Extract tweets from columns: tweet_text, comment_1, comment_2, comment_3
        const tweetColumns = [0, 1, 2, 3]; // tweet_text, comment_1, comment_2, comment_3
        
        for (const colIndex of tweetColumns) {
          if (row[colIndex] && typeof row[colIndex] === 'string' && row[colIndex].trim().length > 0) {
            thread.tweets.push(row[colIndex].trim());
          }
        }

        // Parse time column (index 4)
        if (row[4] !== undefined) {
          thread.scheduledTime = this.parseExcelTime(row[4]);
        }

        // Only add thread if it has at least one tweet
        if (thread.tweets.length > 0) {
          threads.push(thread);
          logger.info(`Parsed thread ${i}: ${thread.tweets.length} posts, scheduled: ${thread.scheduledTime || 'none'}`);
        }

      } catch (error) {
        logger.warn(`Error parsing Excel row ${i + 1}: ${error.message}`);
      }
    }

    logger.info(`Loaded ${threads.length} threads from Excel file`);
    return threads;
  }

  /**
   * Parse Excel time value to readable format
   */
  parseExcelTime(timeValue) {
    try {
      if (typeof timeValue === 'number') {
        // Excel serial date format
        const excelEpoch = new Date(1900, 0, 1);
        const jsDate = new Date(excelEpoch.getTime() + (timeValue - 2) * 24 * 60 * 60 * 1000);
        
        // Format to YYYY-MM-DD HH:MM:SS
        const year = jsDate.getFullYear();
        const month = String(jsDate.getMonth() + 1).padStart(2, '0');
        const day = String(jsDate.getDate()).padStart(2, '0');
        const hours = String(jsDate.getHours()).padStart(2, '0');
        const minutes = String(jsDate.getMinutes()).padStart(2, '0');
        const seconds = String(jsDate.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      } else if (typeof timeValue === 'string') {
        return timeValue.trim();
      }
    } catch (error) {
      logger.warn(`Error parsing time value ${timeValue}: ${error.message}`);
    }
    
    return null;
  }

  /**
   * Get file path (supports both .csv and .xlsx extensions)
   */
  getFilePath(filename) {
    // Remove extension if provided
    const baseFilename = filename.replace(/\.(csv|xlsx|xls)$/, '');
    
    // Try different extensions
    const extensions = ['.csv', '.xlsx', '.xls'];
    
    for (const ext of extensions) {
      const filePath = path.join(this.csvFolder, baseFilename + ext);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
    
    // If not found, default to .csv
    return path.join(this.csvFolder, baseFilename + '.csv');
  }
  /**
   * Parse CSV content (legacy method - keeping for compatibility)
   */
  parseCSV(content) {
    return this.parseCSVContent(content);
  }

  /**
   * Parse a single CSV line (handles quoted fields)
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Add the last field
    result.push(current);

    return result;
  }

  /**
   * Read and parse CSV or Excel file
   */
  readCSV(filename) {
    try {
      const filePath = this.getFilePath(filename);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filename} (searched for .csv, .xlsx, .xls extensions)`);
      }

      // Check file extension
      const ext = path.extname(filePath).toLowerCase();
      
      if (ext === '.xlsx' || ext === '.xls') {
        // Read Excel file with proper Excel format parsing
        logger.info(`Reading Excel file: ${filePath}`);
        return this.readExcelFile(filename);
      } else {
        // Read CSV file
        logger.info(`Reading CSV file: ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf-8');
        const threads = this.parseCSVContent(content);
        
        logger.info(`Loaded ${threads.length} threads from ${filename}`);
        return threads;
      }

    } catch (error) {
      logger.error(`Error reading file ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Create sample CSV file for reference
   */
  createSampleCSV() {
    const sampleContent = `id,title,tweet1,tweet2,tweet3,tweet4,tweet5,scheduledTime
1,"Tips Produktivitas","Cara meningkatkan produktivitas kerja sehari-hari 🧵","1/ Mulai hari dengan membuat to-do list yang realistis. Jangan terlalu banyak target dalam satu hari.","2/ Gunakan teknik Pomodoro - kerja 25 menit, istirahat 5 menit. Ini membantu menjaga fokus.","3/ Batasi notifikasi dari social media dan aplikasi yang tidak penting saat bekerja.","4/ Akhiri hari dengan me-review apa yang sudah dicapai dan merencanakan esok hari. 💪",09:00
2,"Belajar Coding","Thread tentang belajar programming untuk pemula 👨‍💻","1/ Pilih satu bahasa programming terlebih dahulu. Jangan loncat-loncat ke bahasa lain.","2/ Praktik coding setiap hari minimal 30 menit. Konsistensi lebih penting dari durasi.","3/ Bergabung dengan komunitas developer untuk saling belajar dan sharing pengalaman.","4/ Jangan takut untuk bertanya dan membaca dokumentasi resmi. 🚀",14:30
3,"Motivasi Harian","Motivasi untuk tetap semangat menjalani hari 🌟","1/ Setiap hari adalah kesempatan baru untuk menjadi versi terbaik dari diri kita.","2/ Kegagalan bukan akhir dari segalanya, tapi pelajaran berharga untuk berkembang.","3/ Fokus pada progress, bukan perfection. Kemajuan kecil tetaplah kemajuan.","4/ Percaya pada diri sendiri dan proses yang sedang dijalani. You got this! 💪",18:00`;

    const samplePath = path.join(this.csvFolder, 'sample-threads.csv');
    
    try {
      fs.writeFileSync(samplePath, sampleContent, 'utf-8');
      logger.info('Created sample CSV file: sample-threads.csv');
      return true;
    } catch (error) {
      logger.error('Error creating sample CSV:', error);
      return false;
    }
  }

  /**
   * Test connection (always returns true for CSV)
   */
  async testConnection() {
    this.ensureCSVFolder();
    return true;
  }
}

module.exports = CSVReader;
