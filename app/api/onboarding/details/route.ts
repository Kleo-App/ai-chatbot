import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateContentDetails } from '@/app/actions/profile-actions';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { contentDetails } = await req.json();
    
    const result = await updateContentDetails(contentDetails);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, profile: result.profile });
  } catch (error) {
    console.error('Error updating content details:', error);
    return NextResponse.json({ error: 'Failed to update content details' }, { status: 500 });
  }
}
