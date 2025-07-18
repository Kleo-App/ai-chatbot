import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateStylePreference } from '@/app/actions/profile-actions';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { stylePreference } = await req.json();
    
    const result = await updateStylePreference(stylePreference);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, profile: result.profile });
  } catch (error) {
    console.error('Error updating style preference:', error);
    return NextResponse.json({ error: 'Failed to update style preference' }, { status: 500 });
  }
}
