import { NextResponse } from 'next/server';
import { getAllHooks } from '@/lib/db/hooks-queries';

export async function GET() {
  try {
    const hooks = await getAllHooks();
    return NextResponse.json(hooks);
  } catch (error) {
    console.error('Error fetching hooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hooks' },
      { status: 500 }
    );
  }
} 