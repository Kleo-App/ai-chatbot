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

    // Schedule the post for automatic publishing
    await schedulePostForPublishing({
      documentId,
      userId,
      scheduledAt: new Date(scheduledAt),
      timezone,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Post scheduled for automatic publishing' 
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

    // Cancel the scheduled post
    const { cancelScheduledPost } = await import('@/lib/inngest/helpers');
    await cancelScheduledPost({
      documentId,
      userId,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Scheduled post cancelled' 
    });
  } catch (error) {
    console.error('Failed to cancel scheduled post:', error);
    return NextResponse.json(
      { error: 'Failed to cancel scheduled post' },
      { status: 500 }
    );
  }
} 