import 'dotenv/config';
import * as fs from 'fs';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { hook } from '../lib/db/schema-hooks';

// Check for required environment variable
const postgresUrl = process.env.POSTGRES_URL;
if (!postgresUrl) {
  console.error('Error: POSTGRES_URL environment variable is not set');
  process.exit(1);
}

// Setup postgres client
const client = postgres(postgresUrl);
const db = drizzle(client);

// Function to parse CSV with proper handling of quoted fields and newlines
function parseCSV(csvText: string) {
  const rows: any[] = [];
  const lines = csvText.trim().split('\n');
  
  if (lines.length === 0) return rows;
  
  // Parse headers (first line)
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  let i = 1;
  while (i < lines.length) {
    const { row, nextIndex } = parseCSVRow(lines, i);
    if (row && row.length === headers.length) {
      const rowObj: any = {};
      headers.forEach((header, index) => {
        rowObj[header.trim()] = row[index] || '';
      });
      rows.push(rowObj);
    }
    i = nextIndex;
  }
  
  return rows;
}

// Parse a single CSV line, handling quotes properly
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add final field
  result.push(current.trim());
  return result;
}

// Parse a CSV row that might span multiple lines due to quoted newlines
function parseCSVRow(lines: string[], startIndex: number): { row: string[] | null, nextIndex: number } {
  let combinedLine = lines[startIndex];
  let currentIndex = startIndex;
  
  // Check if we have unmatched quotes
  let quoteCount = 0;
  for (const char of combinedLine) {
    if (char === '"') quoteCount++;
  }
  
  // If odd number of quotes, we need to continue to next lines
  while (quoteCount % 2 !== 0 && currentIndex + 1 < lines.length) {
    currentIndex++;
    combinedLine += '\n' + lines[currentIndex];
    
    // Count quotes in the new line
    for (const char of lines[currentIndex]) {
      if (char === '"') quoteCount++;
    }
  }
  
  const row = parseCSVLine(combinedLine);
  return { row, nextIndex: currentIndex + 1 };
}

// Helper function to clean CSV field values
function cleanField(value: string): string {
  if (!value) return '';
  
  // Remove surrounding quotes if present
  let cleaned = value.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  
  // Handle escaped quotes
  cleaned = cleaned.replace(/""/g, '"');
  
  return cleaned;
}

// Main upload function
async function uploadHooks() {
  try {
    console.log('Starting hooks upload...');

    // Read CSV file (you'll need to create this file)
    const csvPath = process.argv[2];
    if (!csvPath) {
      console.error('Please provide the CSV file path as an argument');
      console.error('Usage: pnpm tsx scripts/upload-hooks.ts <csv-file-path>');
      process.exit(1);
    }

    if (!fs.existsSync(csvPath)) {
      console.error(`CSV file not found: ${csvPath}`);
      process.exit(1);
    }

    const csvText = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(csvText);

    console.log(`Found ${rows.length} hooks to upload`);

    // Clear existing hooks (optional - remove this if you want to keep existing data)
    console.log('Clearing existing hooks...');
    await db.delete(hook);

    // Insert hooks
    for (const row of rows) {
      const hookData = {
        title: cleanField(row.Title || ''),
        tags: cleanField(row['Tag(s)'] || ''),
        template: cleanField(row.Template || ''),
        image: cleanField(row.Image) || null,
        postUrl: cleanField(row['Post URL']) || null,
      };

      // Skip rows with empty titles
      if (!hookData.title.trim()) {
        console.log('Skipping row with empty title');
        continue;
      }

      await db.insert(hook).values(hookData);
      console.log(`Inserted hook: ${hookData.title}`);
        }

    console.log('✅ All hooks uploaded successfully!');
  } catch (error) {
    console.error('❌ Error uploading hooks:', error);
  } finally {
    await client.end();
  }
}

// Run the upload
uploadHooks(); 