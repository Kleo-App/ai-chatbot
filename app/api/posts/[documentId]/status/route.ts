import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateDocumentStatus } from '@/lib/db/queries';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { documentId } = await params;
    const { status, scheduledAt, scheduledTimezone, publishedAt } = await request.json();

    if (!status || !['draft', 'scheduled', 'published'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updatedDocument = await updateDocumentStatus({
      id: documentId,
      status,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      scheduledTimezone: scheduledTimezone || undefined,
      publishedAt: publishedAt ? new Date(publishedAt) : undefined,
    });

    return NextResponse.json({ success: true, document: updatedDocument[0] });
  } catch (error) {
    console.error('Error updating document status:', error);
    return NextResponse.json(
      { error: 'Failed to update document status' },
      { status: 500 }
    );
  }
} 