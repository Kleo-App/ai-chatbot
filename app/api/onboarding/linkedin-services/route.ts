import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateLinkedInServices } from '@/app/actions/profile-actions';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { linkedInServices } = await req.json();
    
    const result = await updateLinkedInServices(linkedInServices);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, profile: result.profile });
  } catch (error) {
    console.error('Error updating LinkedIn services:', error);
    return NextResponse.json({ error: 'Failed to update LinkedIn services' }, { status: 500 });
  }
}
