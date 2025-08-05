import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { schedulePostForPublishing } from '@/lib/inngest/helpers';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { documentId, scheduledAt, timezone } = await request.json();
    
    if (!documentId || !scheduledAt || !timezone) {
      return NextResponse.json(
        { error: 'Missing required fields: documentId, scheduledAt, timezone' },
        { status: 400 }
      );
    }

    // First, check if there's an existing scheduled job and cancel it
    let existingWorkflowRunId: string | undefined;
    try {
      const { getDocumentById } = await import('@/lib/db/queries');
      const doc = await getDocumentById({ id: documentId });
      if (doc?.workflowRunId && doc.status === 'scheduled') {
        existingWorkflowRunId = doc.workflowRunId;
        
        // Cancel the existing job (mark as reschedule to avoid database conflicts)
        const { cancelScheduledPost } = await import('@/lib/inngest/helpers');
        await cancelScheduledPost({
          documentId,
          userId,
          workflowRunId: existingWorkflowRunId,
          isReschedule: true,
        });
      }
    } catch (error) {
      console.warn('Failed to cancel existing job:', error);
      // Continue with scheduling new job
    }

    // Schedule the post for automatic publishing
    const result = await schedulePostForPublishing({
      documentId,
      userId,
      scheduledAt: new Date(scheduledAt),
      timezone,
    });

    // Store the workflow run ID in the database if we got one
    if (result.workflowRunId) {
      try {
        const { updateDocumentStatus } = await import('@/lib/db/queries');
        await updateDocumentStatus({
          id: documentId,
          status: 'scheduled',
          workflowRunId: result.workflowRunId,
        });
      } catch (dbError) {
        console.error('Failed to store workflow run ID:', dbError);
        // Continue - the scheduling still worked
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: existingWorkflowRunId ? 'Post rescheduled for automatic publishing' : 'Post scheduled for automatic publishing',
      workflowRunId: result.workflowRunId,
      wasRescheduled: !!existingWorkflowRunId
    });
  } catch (error) {
    console.error('Failed to schedule post:', error);
    return NextResponse.json(
      { error: 'Failed to schedule post for automatic publishing' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { documentId } = await request.json();
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Missing required field: documentId' },
        { status: 400 }
      );
    }

    // Get the workflow run ID from the database
    let workflowRunId: string | undefined;
    try {
      const { getDocumentById } = await import('@/lib/db/queries');
      const doc = await getDocumentById({ id: documentId });
      workflowRunId = doc?.workflowRunId || undefined;
    } catch (dbError) {
      console.warn('Failed to fetch workflow run ID from database:', dbError);
    }

    // Cancel the scheduled post with workflow run ID if available
    const { cancelScheduledPost } = await import('@/lib/inngest/helpers');
    const result = await cancelScheduledPost({
      documentId,
      userId,
      workflowRunId,
    });

    // Clear the workflow run ID from the database
    try {
      const { updateDocumentStatus } = await import('@/lib/db/queries');
      await updateDocumentStatus({
        id: documentId,
        status: 'draft',
        workflowRunId: null,
        scheduledAt: undefined,
        scheduledTimezone: undefined,
      });
    } catch (dbError) {
      console.error('Failed to clear workflow run ID from database:', dbError);
      // Continue - the cancellation still worked
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Scheduled post cancelled',
      method: result.method 
    });
  } catch (error) {
    console.error('Failed to cancel scheduled post:', error);
    return NextResponse.json(
      { error: 'Failed to cancel scheduled post' },
      { status: 500 }
    );
  }
} 