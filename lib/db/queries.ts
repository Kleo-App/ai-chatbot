import 'server-only';

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  lte,
  type SQL,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user,
  chat,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
  type Chat,
  stream,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import type { VisibilityType } from '@/components/visibility-selector';
import { ChatSDKError } from '../errors';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client, {
  schema: { user, chat, message, vote, document, suggestion, stream },
});

export async function createUser({
  id,
  email,
  firstName,
  lastName,
}: {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}) {
  try {
    const [newUser] = await db.insert(user).values({ 
      id, 
      email, 
      firstName, 
      lastName 
    }).returning();
    return newUser;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create user');
  }
}

export async function getUser({ id }: { id: string }) {
  try {
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    return existingUser;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get user');
  }
}

export async function getOrCreateUser({
  id,
  email,
  firstName,
  lastName,
}: {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}) {
  try {
    // Try to get existing user first
    const existingUser = await getUser({ id });
    if (existingUser) {
      return existingUser;
    }

    // Create new user if not found
    return await createUser({ id, email, firstName, lastName });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get or create user');
  }
}



export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    const [newChat] = await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    }).returning();
    return newChat;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save chat');
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete chat by id',
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id),
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to vote message');
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get votes by chat id',
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
  status = 'draft',
  scheduledAt,
  scheduledTimezone,
  publishedAt,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
  status?: 'draft' | 'scheduled' | 'published';
  scheduledAt?: Date;
  scheduledTimezone?: string;
  publishedAt?: Date;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        status,
        scheduledAt,
        scheduledTimezone,
        publishedAt,
        createdAt: new Date(),
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save document');
  }
}

export async function updateDocumentStatus({
  id,
  status,
  scheduledAt,
  scheduledTimezone,
  publishedAt,
}: {
  id: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduledAt?: Date;
  scheduledTimezone?: string;
  publishedAt?: Date;
}) {
  try {
    return await db
      .update(document)
      .set({
        status,
        scheduledAt,
        scheduledTimezone,
        publishedAt,
      })
      .where(eq(document.id, id))
      .returning();
  } catch (error) {
    console.error('Database error in updateDocumentStatus:', error);
    throw new ChatSDKError('bad_request:database', 'Failed to update document status');
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get document by id',
    );
  }
}

export async function getDocumentsByUserId({ 
  userId,
  limit = 50,
}: { 
  userId: string;
  limit?: number;
}) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.userId, userId))
      .orderBy(desc(document.createdAt))
      .limit(limit);

    return documents;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by user id',
    );
  }
}

export async function getLatestDocumentsByUserId({ 
  userId,
  limit = 50,
  status,
}: { 
  userId: string;
  limit?: number;
  status?: 'draft' | 'scheduled' | 'published';
}) {
  try {
    // Build the where condition
    let whereCondition = eq(document.userId, userId);
    if (status) {
      whereCondition = and(whereCondition, eq(document.status, status))!;
    }

    // Get the latest version of each document by grouping by id and taking the max createdAt
    const documents = await db
      .select({
        id: document.id,
        createdAt: document.createdAt,
        title: document.title,
        content: document.content,
        kind: document.kind,
        status: document.status,
        scheduledAt: document.scheduledAt,
        scheduledTimezone: document.scheduledTimezone,
        publishedAt: document.publishedAt,
        userId: document.userId,
      })
      .from(document)
      .where(whereCondition)
      .orderBy(desc(document.createdAt));

    // Group by document id and keep only the latest version of each
    const latestDocuments = new Map();
    for (const doc of documents) {
      if (!latestDocuments.has(doc.id) || 
          new Date(doc.createdAt) > new Date(latestDocuments.get(doc.id).createdAt)) {
        latestDocuments.set(doc.id, doc);
      }
    }

    // Convert map to array and sort by createdAt descending, then limit
    return Array.from(latestDocuments.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get latest documents by user id',
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete documents by id after timestamp',
    );
  }
}

export async function deleteDocumentById({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  try {
    // First verify the document belongs to the user
    const documents = await getDocumentsById({ id });
    const [documentData] = documents;

    if (!documentData || documentData.userId !== userId) {
      throw new ChatSDKError('forbidden:document', 'Document not found or access denied');
    }

    // Delete all suggestions for this document
    await db
      .delete(suggestion)
      .where(eq(suggestion.documentId, id));

    // Delete all versions of the document
    return await db
      .delete(document)
      .where(eq(document.id, id))
      .returning();
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete document',
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save suggestions',
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by id',
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages by chat id after timestamp',
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat visibility by id',
    );
  }
}

export async function updateChatTitleById({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  try {
    return await db.update(chat).set({ title }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat title by id',
    );
  }
}

export async function updateChatPinnedById({
  chatId,
  pinned,
}: {
  chatId: string;
  pinned: boolean;
}) {
  try {
    return await db.update(chat).set({ pinned }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat pinned status by id',
    );
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, 'user'),
        ),
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id',
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create stream id',
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streams = await db
      .select()
      .from(stream)
      .where(eq(stream.chatId, chatId));

    return streams.map((s) => s.id);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stream ids by chat id',
    );
  }
}

export async function deleteMessageById({ messageId }: { messageId: string }) {
  try {
    // First delete any votes associated with this message
    await db
      .delete(vote)
      .where(eq(vote.messageId, messageId));

    // Then delete the message itself
    const deletedMessage = await db
      .delete(message)
      .where(eq(message.id, messageId))
      .returning();

    return deletedMessage[0];
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete message by id',
    );
  }
}

export async function getScheduledPosts({
  userId,
  limit = 50,
}: {
  userId: string;
  limit?: number;
}) {
  try {
    return await db
      .select()
      .from(document)
      .where(and(
        eq(document.userId, userId),
        eq(document.status, 'scheduled')
      ))
      .orderBy(document.scheduledAt)
      .limit(limit);
  } catch (error) {
    console.error('Database error in getScheduledPosts:', error);
    throw new ChatSDKError('bad_request:database', 'Failed to fetch scheduled posts');
  }
}

export async function getPostsScheduledBetween({
  userId,
  startDate,
  endDate,
}: {
  userId: string;
  startDate: Date;
  endDate: Date;
}) {
  try {
    return await db
      .select()
      .from(document)
      .where(and(
        eq(document.userId, userId),
        eq(document.status, 'scheduled'),
        gte(document.scheduledAt, startDate),
        lte(document.scheduledAt, endDate)
      ))
      .orderBy(document.scheduledAt);
  } catch (error) {
    console.error('Database error in getPostsScheduledBetween:', error);
    throw new ChatSDKError('bad_request:database', 'Failed to fetch scheduled posts in date range');
  }
}

export async function getOverdueScheduledPosts() {
  try {
    const now = new Date();
    return await db
      .select()
      .from(document)
      .where(and(
        eq(document.status, 'scheduled'),
        lt(document.scheduledAt, now)
      ))
      .orderBy(document.scheduledAt);
  } catch (error) {
    console.error('Database error in getOverdueScheduledPosts:', error);
    throw new ChatSDKError('bad_request:database', 'Failed to fetch overdue scheduled posts');
  }
}
