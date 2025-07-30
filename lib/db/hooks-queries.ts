import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, desc } from 'drizzle-orm';
import postgres from 'postgres';
import { hook, type Hook } from './schema-hooks';

// Setup database connection
const client = postgres(process.env.POSTGRES_URL!, { max: 1 });
const db = drizzle(client);

export async function getAllHooks(): Promise<Hook[]> {
  try {
    const hooks = await db
      .select()
      .from(hook)
      .orderBy(desc(hook.createdAt));
    
    return hooks;
  } catch (error) {
    console.error('Error fetching hooks:', error);
    throw error;
  }
}

export async function getHookById(id: string): Promise<Hook | null> {
  try {
    const [hookResult] = await db
      .select()
      .from(hook)
      .where(eq(hook.id, id))
      .limit(1);
    
    return hookResult || null;
  } catch (error) {
    console.error('Error fetching hook by ID:', error);
    throw error;
  }
}

export async function getHooksByTag(tag: string): Promise<Hook[]> {
  try {
    const hooks = await db
      .select()
      .from(hook)
      .where(eq(hook.tags, tag))
      .orderBy(desc(hook.createdAt));
    
    return hooks;
  } catch (error) {
    console.error('Error fetching hooks by tag:', error);
    throw error;
  }
} 