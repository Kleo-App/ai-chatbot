import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { 
  user, 
  chat, 
  message, 
  messageDeprecated, 
  vote, 
  voteDeprecated, 
  document, 
  suggestion, 
  stream,
  onboarding,
  userProfile,
} from '@/lib/db/schema';

// Connect to the database
// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

/**
 * API route to delete all users and related data from the database
 * This is a protected route that should only be used in development
 */
export async function DELETE(request: NextRequest) {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development mode' },
        { status: 403 }
      );
    }

    // Delete in order to respect foreign key constraints
    console.log('Deleting suggestions...');
    await db.delete(suggestion);

    console.log('Deleting documents...');
    await db.delete(document);

    console.log('Deleting votes v2...');
    await db.delete(vote);

    console.log('Deleting votes (deprecated)...');
    await db.delete(voteDeprecated);

    console.log('Deleting messages v2...');
    await db.delete(message);

    console.log('Deleting messages (deprecated)...');
    await db.delete(messageDeprecated);

    console.log('Deleting streams...');
    await db.delete(stream);

    console.log('Deleting chats...');
    await db.delete(chat);

    console.log('Deleting onboarding records...');
    await db.delete(onboarding);

    console.log('Deleting users...');
    await db.delete(user);

    return NextResponse.json({ 
      success: true,
      message: 'All users and related data have been deleted successfully!' 
    });
  } catch (error) {
    console.error('Error deleting users:', error);
    return NextResponse.json(
      { error: 'Failed to delete users', details: error },
      { status: 500 }
    );
  }
}
