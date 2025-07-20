import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { linkedinConnection } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Database connection
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client, { schema: { linkedinConnection } });

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Update LinkedIn connection to inactive
    const result = await db
      .update(linkedinConnection)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(linkedinConnection.userId, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('LinkedIn disconnect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 