import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, desc } from 'drizzle-orm';
import postgres from 'postgres';
import { post, type Post } from './schema-posts';

// Setup database connection
const client = postgres(process.env.POSTGRES_URL!, { max: 1 });
const db = drizzle(client);

export async function getAllPosts(): Promise<Post[]> {
  try {
    const posts = await db
      .select()
      .from(post)
      .orderBy(desc(post.createdAt));
    
    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
}

export async function getPostById(id: string): Promise<Post | null> {
  try {
    const [postResult] = await db
      .select()
      .from(post)
      .where(eq(post.id, id))
      .limit(1);
    
    return postResult || null;
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    throw error;
  }
} 