import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateSelectedTopics } from '@/app/actions/profile-actions';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { selectedTopics } = await req.json();
    
    const result = await updateSelectedTopics(selectedTopics);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, profile: result.profile });
  } catch (error) {
    console.error('Error updating selected topics:', error);
    return NextResponse.json({ error: 'Failed to update selected topics' }, { status: 500 });
  }
}
