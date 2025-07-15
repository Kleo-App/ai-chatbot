import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createOnboardingTable } from '../lib/db/migrations/create-onboarding-table';

async function runMigrations() {
  if (!process.env.POSTGRES_URL) {
    console.error('POSTGRES_URL environment variable is not defined');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const client = postgres(process.env.POSTGRES_URL, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  
  const db = drizzle(client);

  try {
    console.log('Running migrations...');
    
    // Run migrations
    await createOnboardingTable(db);
    
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
