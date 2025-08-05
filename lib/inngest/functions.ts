import { inngest } from './client';
import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { document, linkedinConnection } from '@/lib/db/schema';
import {
  LinkedInPublishError,
  TokenRefreshError,
  DocumentNotFoundError,
  LinkedInConnectionError,
  handleLinkedInAPIError,
} from './error-handling';

// Database connection for Inngest functions
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// Helper function to convert HTML to plain text for LinkedIn
function htmlToPlainText(html: string): string {
  // Handle TipTap editor format which uses <p><br class="ProseMirror-trailingBreak"></p> for intentional breaks
  let text = html
    // First, identify paragraphs with trailing breaks (intentional double line breaks)
    .replace(/<p[^>]*>\s*<br[^>]*>\s*<\/p>/gi, '___DOUBLE_BREAK___')
    // Convert regular paragraph boundaries to single line breaks
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
    // Remove all remaining paragraph and br tags
    .replace(/<\/?p[^>]*>/gi, '')
    .replace(/<br[^>]*>/gi, '\n')
    // Convert div tags to line breaks
    .replace(/<\/div>\s*<div[^>]*>/gi, '\n')
    .replace(/<\/?div[^>]*>/gi, '')
    // Remove all other HTML tags
    .replace(/<[^>]*>/g, '')
    // Convert double break markers to actual double line breaks
    .replace(/___DOUBLE_BREAK___/g, '\n\n')
    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up: remove leading/trailing whitespace from each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Remove any leading/trailing empty lines
    .replace(/^\n+|\n+$/g, '')
    // Clean up excessive line breaks (more than 2 consecutive)
    .replace(/\n{3,}/g, '\n\n');

  return text;
}

interface SchedulePostEventData {
  documentId: string;
  userId: string;
  scheduledAt: string; // ISO string
  timezone: string;
}

interface PublishPostEventData {
  documentId: string;
  userId: string;
}

// Function to schedule a LinkedIn post for future publishing
export const scheduleLinkedInPost = inngest.createFunction(
  {
    id: 'schedule-linkedin-post',
    name: 'Schedule LinkedIn Post',
  },
  { event: 'linkedin/post.scheduled' },
  async ({ event, step }) => {
    const { documentId, userId, scheduledAt, timezone }: SchedulePostEventData = event.data;

    // Sleep until the scheduled time
    await step.sleepUntil('wait-for-publish-time', new Date(scheduledAt));

    // Before publishing, verify the post is still scheduled for this time
    // This prevents old workflows from publishing after rescheduling
    const currentDocument = await step.run('verify-schedule', async () => {
      const [doc] = await db
        .select()
        .from(document)
        .where(and(
          eq(document.id, documentId),
          eq(document.userId, userId)
        ))
        .limit(1);
      
      return doc;
    });

    // Check if the post is still scheduled for the original time
    if (!currentDocument || 
        currentDocument.status !== 'scheduled' || 
        !currentDocument.scheduledAt ||
        new Date(currentDocument.scheduledAt).getTime() !== new Date(scheduledAt).getTime()) {
      return { 
        success: true, 
        message: `Post ${documentId} was rescheduled or cancelled, skipping publication` 
      };
    }

    // Post is still scheduled for this time, proceed with publishing
    await step.sendEvent('trigger-publish', {
      name: 'linkedin/post.publish',
      data: {
        documentId,
        userId,
      },
    });

    return { success: true, message: `Post scheduled for ${scheduledAt}` };
  }
);

// Function to actually publish the LinkedIn post
export const publishLinkedInPost = inngest.createFunction(
  {
    id: 'publish-linkedin-post',
    name: 'Publish LinkedIn Post',
    retries: 3,
  },
  { event: 'linkedin/post.publish' },
  async ({ event, step }) => {
    const { documentId, userId }: PublishPostEventData = event.data;

    // Get the document to publish
    const postDocument = await step.run('fetch-document', async () => {
      const docs = await db
        .select()
        .from(document)
        .where(and(
          eq(document.id, documentId),
          eq(document.userId, userId),
          eq(document.status, 'scheduled')
        ))
        .limit(1);

      if (docs.length === 0) {
        throw new DocumentNotFoundError(documentId);
      }

      return docs[0];
    });

    // Get LinkedIn connection for the user
    const connection = await step.run('fetch-linkedin-connection', async () => {
      const connections = await db
        .select()
        .from(linkedinConnection)
        .where(and(
          eq(linkedinConnection.userId, userId),
          eq(linkedinConnection.isActive, true)
        ))
        .limit(1);

      if (connections.length === 0) {
        throw new LinkedInConnectionError(userId);
      }

      return connections[0];
    });

    // Check if token needs refresh
    const refreshedConnection = await step.run('check-and-refresh-token', async () => {
      const now = new Date();
      if (connection.expiresAt && new Date(connection.expiresAt) <= now) {
        // Token expired, try to refresh
        if (connection.refreshToken) {
          const refreshResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: connection.refreshToken,
              client_id: process.env.LINKEDIN_CLIENT_ID!,
              client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
            }),
          });

          if (!refreshResponse.ok) {
            throw new TokenRefreshError('Failed to refresh LinkedIn token. User needs to reconnect.');
          }

          const refreshData = await refreshResponse.json();
          
          // Update the connection with new token
          await db
            .update(linkedinConnection)
            .set({
              accessToken: refreshData.access_token,
              expiresAt: new Date(Date.now() + refreshData.expires_in * 1000),
              updatedAt: new Date(),
            })
            .where(eq(linkedinConnection.id, connection.id));

          return { ...connection, accessToken: refreshData.access_token };
        } else {
          throw new TokenRefreshError('LinkedIn connection expired and no refresh token available. User needs to reconnect.');
        }
      }
      return connection;
    });

    // Publish to LinkedIn
    const publishResult = await step.run('publish-to-linkedin', async () => {
      const publishResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshedConnection.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          author: `urn:li:person:${refreshedConnection.linkedinId}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: htmlToPlainText(postDocument.content || ''),
              },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
          },
        }),
      });

      if (!publishResponse.ok) {
        const errorData = await publishResponse.text();
        console.error('LinkedIn API error:', errorData);
        throw handleLinkedInAPIError(publishResponse, errorData);
      }

      const result = await publishResponse.json();
      return { success: true, postId: result.id };
    });

    // Update document status to published
    await step.run('update-document-status', async () => {
      await db
        .update(document)
        .set({
          status: 'published',
          publishedAt: new Date(),
        })
        .where(eq(document.id, documentId));

      return { success: true };
    });

    return {
      success: true,
      message: `Post ${documentId} published successfully`,
      linkedinPostId: publishResult.postId,
    };
  }
);

// Function to cancel a scheduled LinkedIn post
export const cancelScheduledLinkedInPost = inngest.createFunction(
  {
    id: 'cancel-scheduled-linkedin-post',
    name: 'Cancel Scheduled LinkedIn Post',
  },
  { event: 'linkedin/post.cancel' },
  async ({ event, step }) => {
    const { documentId, userId, isReschedule } = event.data;

    // Only update database status if this is a true cancellation (not a reschedule)
    // For reschedules, the API already updated the database with the new schedule
    if (!isReschedule) {
      await step.run('update-document-status', async () => {
        await db
          .update(document)
          .set({
            status: 'draft',
            scheduledAt: null,
            scheduledTimezone: null,
            workflowRunId: null,
          })
          .where(and(
            eq(document.id, documentId),
            eq(document.userId, userId)
          ));

        return { success: true };
      });
    }

    const action = isReschedule ? 'rescheduled' : 'cancelled';
    return { success: true, message: `Scheduled post ${documentId} ${action}` };
  }
); 