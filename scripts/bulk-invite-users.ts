import 'dotenv/config';
import * as fs from 'fs';

// Check for required environment variable
const clerkSecretKey = process.env.CLERK_SECRET_KEY;
if (!clerkSecretKey) {
  console.error('Error: CLERK_SECRET_KEY environment variable is not set');
  console.error('Please add your Clerk Secret Key to your .env file:');
  console.error('CLERK_SECRET_KEY=sk_live_...');
  process.exit(1);
}

// Configuration
const CLERK_API_BASE_URL = 'https://api.clerk.com/v1';
const DEFAULT_CSV_PATH = './example-invitations.csv';

// Types
interface InvitationData {
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  department?: string;
  redirectUrl?: string;
  metadata?: Record<string, any>;
}

interface InvitationResult {
  email: string;
  success: boolean;
  invitationId?: string;
  error?: string;
}

// Function to parse CSV with proper handling of quoted fields and newlines
function parseCSV(csvText: string): any[] {
  const rows: any[] = [];
  const lines = csvText.trim().split('\n');
  
  if (lines.length === 0) return rows;
  
  // Parse headers (first line)
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  let i = 1;
  while (i < lines.length) {
    const { row, nextIndex } = parseCSVRow(lines, i);
    if (row && row.length > 0) {
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
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current);
  
  return result;
}

// Parse multiple CSV rows (handles multi-line quoted fields)
function parseCSVRow(lines: string[], startIndex: number): { row: string[]; nextIndex: number } {
  let currentLine = lines[startIndex];
  let lineIndex = startIndex;
  
  // Count quotes to determine if we need to continue to next line
  while (lineIndex < lines.length) {
    const quoteCount = (currentLine.match(/"/g) || []).length;
    
    // If even number of quotes, the row is complete
    if (quoteCount % 2 === 0) {
      break;
    }
    
    // Add next line and continue
    lineIndex++;
    if (lineIndex < lines.length) {
      currentLine += '\n' + lines[lineIndex];
    }
  }
  
  const row = parseCSVLine(currentLine);
  return { row, nextIndex: lineIndex + 1 };
}

// Transform CSV row to invitation data
function transformToInvitationData(row: any): InvitationData {
  // Try different possible email column names
  const emailFields = ['email', 'Email', 'customer email', 'Customer Email', 'email_address', 'Email Address'];
  let email = '';
  
  for (const field of emailFields) {
    if (row[field]?.trim()) {
      email = row[field].trim();
      break;
    }
  }

  const data: InvitationData = { email };

  // Add optional fields if they exist
  if (row.firstName || row['First Name'] || row['first name']) {
    data.firstName = (row.firstName || row['First Name'] || row['first name']).trim();
  }
  if (row.lastName || row['Last Name'] || row['last name']) {
    data.lastName = (row.lastName || row['Last Name'] || row['last name']).trim();
  }
  if (row.role || row.Role) data.role = (row.role || row.Role).trim();
  if (row.department || row.Department) data.department = (row.department || row.Department).trim();
  if (row.redirectUrl || row['Redirect URL']) data.redirectUrl = (row.redirectUrl || row['Redirect URL']).trim();

  // Build metadata from available fields
  const metadata: Record<string, any> = {};
  if (data.firstName) metadata.firstName = data.firstName;
  if (data.lastName) metadata.lastName = data.lastName;
  if (data.role) metadata.role = data.role;
  if (data.department) metadata.department = data.department;

  // Add any custom metadata fields (fields not in the standard list)
  const standardFields = [...emailFields, 'firstName', 'First Name', 'first name', 'lastName', 'Last Name', 'last name', 'role', 'Role', 'department', 'Department', 'redirectUrl', 'Redirect URL'];
  Object.keys(row).forEach(key => {
    if (!standardFields.includes(key) && row[key]?.trim()) {
      metadata[key] = row[key].trim();
    }
  });

  if (Object.keys(metadata).length > 0) {
    data.metadata = metadata;
  }

  return data;
}

// Create invitation via Clerk API
async function createInvitation(data: InvitationData): Promise<InvitationResult> {
  try {
    const payload: any = {
      email_address: data.email
    };

    if (data.metadata && Object.keys(data.metadata).length > 0) {
      payload.public_metadata = data.metadata;
    }

    if (data.redirectUrl) {
      payload.redirect_url = data.redirectUrl;
    }

    const response = await fetch(`${CLERK_API_BASE_URL}/invitations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    const result = await response.json();
    
    return {
      email: data.email,
      success: true,
      invitationId: result.id
    };
  } catch (error) {
    return {
      email: data.email,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Main function
async function main() {
  const csvPath = process.argv[2] || DEFAULT_CSV_PATH;
  
  console.log('🚀 Starting bulk user invitation process...');
  console.log(`📁 Reading CSV file: ${csvPath}`);

  // Read and parse CSV
  let csvData: string;
  try {
    csvData = fs.readFileSync(csvPath, 'utf-8');
  } catch (error) {
    console.error(`❌ Error reading CSV file: ${error}`);
    process.exit(1);
  }

  const rows = parseCSV(csvData);
  console.log(`📊 Found ${rows.length} users to invite`);

  if (rows.length === 0) {
    console.log('ℹ️  No users found in CSV file');
    return;
  }

  // Validate email addresses
  const validRows = rows.filter(row => {
    // Try different possible email column names
    const emailFields = ['email', 'Email', 'customer email', 'Customer Email', 'email_address', 'Email Address'];
    let email = '';
    
    for (const field of emailFields) {
      if (row[field]?.trim()) {
        email = row[field].trim();
        break;
      }
    }
    
    if (!email) {
      console.warn(`⚠️  Skipping row with missing email: ${JSON.stringify(row)}`);
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.warn(`⚠️  Skipping row with invalid email: ${email}`);
      return false;
    }
    
    return true;
  });

  console.log(`✅ ${validRows.length} valid email addresses found`);

  if (validRows.length === 0) {
    console.log('❌ No valid users to invite');
    return;
  }

  // Process invitations
  const results: InvitationResult[] = [];
  const batchSize = 10; // Process in batches to avoid rate limiting
  
  for (let i = 0; i < validRows.length; i += batchSize) {
    const batch = validRows.slice(i, i + batchSize);
    console.log(`\n📤 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(validRows.length / batchSize)} (${batch.length} users)...`);
    
    const batchPromises = batch.map(async (row) => {
      const invitationData = transformToInvitationData(row);
      console.log(`  📧 Inviting: ${invitationData.email}`);
      
      const result = await createInvitation(invitationData);
      
      if (result.success) {
        console.log(`  ✅ ${result.email} - Invitation created (ID: ${result.invitationId})`);
      } else {
        console.log(`  ❌ ${result.email} - Failed: ${result.error}`);
      }
      
      return result;
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Add delay between batches to respect rate limits
    if (i + batchSize < validRows.length) {
      console.log('  ⏳ Waiting 1 second before next batch...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log('\n📋 Summary:');
  console.log(`✅ Successfully invited: ${successful.length} users`);
  console.log(`❌ Failed to invite: ${failed.length} users`);

  if (failed.length > 0) {
    console.log('\n❌ Failed invitations:');
    failed.forEach(result => {
      console.log(`  • ${result.email}: ${result.error}`);
    });
  }

  console.log('\n🎉 Bulk invitation process completed!');
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});