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
  workflowRunId?: string;
  isReschedule?: boolean;
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
    
    const { ids } = await inngest.send({
      id: eventId,
      name: 'linkedin/post.scheduled',
      data: {
        documentId,
        userId,
        scheduledAt: scheduledAt.toISOString(),
        timezone,
      },
    });

    // Get the workflow run ID from the triggered event
    let workflowRunId: string | null = null;
    if (ids.length > 0) {
      try {
        // Fetch runs triggered by this event using Inngest REST API
        const runId = await getWorkflowRunId(ids[0]);
        workflowRunId = runId;
      } catch (fetchError) {
        console.warn('Failed to fetch workflow run ID:', fetchError);
        // Continue without run ID - we'll fall back to the old cancellation method
      }
    }

    return { success: true, workflowRunId };
  } catch (error) {
    console.error('Failed to schedule post:', error);
    throw new Error('Failed to schedule post for publishing');
  }
}

/**
 * Get workflow run ID from event ID using Inngest REST API
 * Note: This only works in production with a proper API key
 */
async function getWorkflowRunId(eventId: string): Promise<string | null> {
  // Skip in local development - Dev Server doesn't support REST API the same way
  if (process.env.NODE_ENV !== 'production' || process.env.INNGEST_DEV) {
    console.log('Skipping workflow run ID fetch in local development');
    return null;
  }

  // Check if we have the proper API key (not signing key)
  const apiKey = process.env.INNGEST_API_KEY;
  if (!apiKey) {
    console.warn('INNGEST_API_KEY not found - skipping workflow run ID fetch');
    return null;
  }

  const maxRetries = 3; // Reduced retries
  const retryDelay = 1000; // 1 second

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`https://api.inngest.com/v1/events/${eventId}/runs`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Inngest API authentication failed - check INNGEST_API_KEY');
          return null; // Don't retry on auth failures
        }
        throw new Error(`API request failed: ${response.status}`);
      }

      const json = await response.json();
      const runs = json.data;

      if (runs && runs.length > 0) {
        // Find the schedule function run (there might be multiple functions triggered)
        const scheduleRun = runs.find((run: any) => 
          run.function_id === 'schedule-linkedin-post' || 
          run.function_id.includes('schedule')
        );
        
        if (scheduleRun) {
          return scheduleRun.run_id;
        }
        
        // Fallback to first run if no schedule-specific run found
        return runs[0].run_id;
      }

      // If no runs yet, wait and retry
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    } catch (error) {
      console.warn(`Attempt ${attempt + 1} failed to fetch run ID:`, error);
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  return null;
}

/**
 * Cancel a scheduled LinkedIn post using direct workflow cancellation
 */
export async function cancelScheduledPost({
  documentId,
  userId,
  workflowRunId,
  isReschedule = false,
}: CancelPostParams) {
  try {
    if (workflowRunId) {
      // Use direct workflow cancellation via Inngest REST API
      const cancelled = await cancelWorkflowRun(workflowRunId);
      if (cancelled) {
        return { success: true, method: 'direct' };
      }
      
      // Fallback to event-based cancellation if direct cancellation fails
      console.warn('Direct cancellation failed, falling back to event-based cancellation');
    }

    // Fallback: Send cancellation event (with reschedule flag)
    await inngest.send({
      name: 'linkedin/post.cancel',
      data: {
        documentId,
        userId,
        isReschedule,
      },
    });

    return { success: true, method: 'event' };
  } catch (error) {
    console.error('Failed to cancel scheduled post:', error);
    throw new Error('Failed to cancel scheduled post');
  }
}

/**
 * Cancel a specific workflow run using Inngest REST API
 * Note: This only works in production with a proper API key
 */
async function cancelWorkflowRun(runId: string): Promise<boolean> {
  // Skip in local development - Dev Server doesn't support REST API the same way
  if (process.env.NODE_ENV !== 'production' || process.env.INNGEST_DEV) {
    console.log('Skipping direct workflow cancellation in local development');
    return false; // Fall back to event-based cancellation
  }

  // Check if we have the proper API key (not signing key)
  const apiKey = process.env.INNGEST_API_KEY;
  if (!apiKey) {
    console.warn('INNGEST_API_KEY not found - skipping direct workflow cancellation');
    return false; // Fall back to event-based cancellation
  }

  try {
    const response = await fetch(`https://api.inngest.com/v1/runs/${runId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log(`Successfully cancelled workflow run: ${runId}`);
      return true;
    } else {
      if (response.status === 401) {
        console.warn('Inngest API authentication failed - check INNGEST_API_KEY');
      } else {
        console.error(`Failed to cancel workflow run ${runId}: ${response.status} ${response.statusText}`);
      }
      return false;
    }
  } catch (error) {
    console.error(`Error cancelling workflow run ${runId}:`, error);
    return false;
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