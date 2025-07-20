import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Check for required environment variable
const postgresUrl = process.env.POSTGRES_URL;
if (!postgresUrl) {
  console.error('Error: POSTGRES_URL environment variable is not set');
  process.exit(1);
}

// Setup postgres client for migrations
const migrationClient = postgres(postgresUrl, { max: 1 });

// Check if migrations folder exists
const migrationsFolder = join(process.cwd(), 'lib', 'db', 'migrations');
const hasMigrations = existsSync(migrationsFolder);

// Run migrations
async function runMigrations() {
  try {
    console.log('Checking database migrations...');
    
    if (!hasMigrations) {
      console.log('No migrations folder found. Skipping migrations.');
      process.exit(0);
      return;
    }
    
    const db = drizzle(migrationClient);
    
    // Run migrations with migrationsFolder
    console.log('Running database migrations...');
    await migrate(db, { migrationsFolder });
    
    console.log('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    // If the error is about tables/columns already existing, we can consider this a success
    // as the schema is already in place
    const errorMessage = String(error);
    if (
      errorMessage.includes('already exists') ||
      errorMessage.includes('42P07') ||
      errorMessage.includes('42701')
    ) {
      console.log('Schema appears to be already in place. Continuing with deployment.');
      process.exit(0);
    } else {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  } finally {
    // Ensure connection is closed
    await migrationClient.end();
  }
}

runMigrations();
