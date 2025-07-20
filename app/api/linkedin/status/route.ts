import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { linkedinConnection } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Database connection
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client, { schema: { linkedinConnection } });

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get LinkedIn connection for the user
    const connection = await db
      .select()
      .from(linkedinConnection)
      .where(eq(linkedinConnection.userId, userId))
      .limit(1);

    const isConnected = connection.length > 0 && connection[0].isActive;
    let profile = null;

    if (isConnected) {
      const conn = connection[0];
      profile = {
        firstName: conn.firstName,
        lastName: conn.lastName,
        profilePicture: conn.profilePicture,
        profileUrl: conn.profileUrl,
      };
    }

    return NextResponse.json({
      isConnected,
      profile,
    });
  } catch (error) {
    console.error('LinkedIn status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 