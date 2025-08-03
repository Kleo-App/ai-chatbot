import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { saveChat } from '@/lib/db/queries';
import { getHookById } from '@/lib/db/hooks-queries';
import { generateUUID } from '@/lib/utils';

const createChatSchema = z.object({
  hookId: z.string(),
  variables: z.record(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { hookId, variables } = createChatSchema.parse(body);

    // Get the hook template
    const hookData = await getHookById(hookId);
    if (!hookData) {
      return NextResponse.json(
        { error: 'Hook not found' },
        { status: 404 }
      );
    }

    // Create the chat
    const chat = await saveChat({
      id: generateUUID(),
      title: `LinkedIn Post: ${hookData.title}`,
      userId,
      visibility: 'private',
    });

    return NextResponse.json({
      chatId: chat.id,
      hookTitle: hookData.title,
    });
  } catch (error) {
    console.error('Error creating chat from hook:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    );
  }
} 