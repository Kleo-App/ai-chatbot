import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { message, chat } from '@/lib/db/schema';
import { eq, and, sql, ilike } from 'drizzle-orm';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client, {
  schema: { message, chat },
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Search for messages that contain tool calls for creating this document
    const messagesWithDocument = await db
      .select({
        chatId: message.chatId,
        parts: message.parts,
        createdAt: message.createdAt,
      })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, userId),
          // Search for the document ID in the message parts JSON
          sql`${message.parts}::text LIKE ${'%' + documentId + '%'}`
        )
      )
      .orderBy(message.createdAt)
      .limit(1);

    if (messagesWithDocument.length > 0) {
      const chatId = messagesWithDocument[0].chatId;
      return Response.json({ chatId });
    }

    // If no message found, return null to indicate no chat was found
    return Response.json({ chatId: null });
  } catch (error) {
    console.error('Error finding chat for document:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
} 