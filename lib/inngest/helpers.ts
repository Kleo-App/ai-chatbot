import { inngest } from './client';

export interface SchedulePostParams {
  documentId: string;
  userId: string;
  scheduledAt: Date;
  timezone: string;
}

export interface CancelPostParams {
  documentId: string;
  userId: string;
}

/**
 * Schedule a LinkedIn post for automatic publishing
 */
export async function schedulePostForPublishing({
  documentId,
  userId,
  scheduledAt,
  timezone,
}: SchedulePostParams) {
  try {
    const eventId = `${documentId}-${userId}`;
    
    await inngest.send({
      id: eventId,
      name: 'linkedin/post.scheduled',
      data: {
        documentId,
        userId,
        scheduledAt: scheduledAt.toISOString(),
        timezone,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to schedule post:', error);
    throw new Error('Failed to schedule post for publishing');
  }
}

/**
 * Cancel a scheduled LinkedIn post
 */
export async function cancelScheduledPost({
  documentId,
  userId,
}: CancelPostParams) {
  try {
    await inngest.send({
      name: 'linkedin/post.cancel',
      data: {
        documentId,
        userId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to cancel scheduled post:', error);
    throw new Error('Failed to cancel scheduled post');
  }
}

/**
 * Immediately publish a LinkedIn post (bypass scheduling)
 */
export async function publishPostImmediately({
  documentId,
  userId,
}: CancelPostParams) {
  try {
    await inngest.send({
      name: 'linkedin/post.publish',
      data: {
        documentId,
        userId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to trigger immediate publish:', error);
    throw new Error('Failed to publish post immediately');
  }
} 