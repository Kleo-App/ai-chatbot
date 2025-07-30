import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { saveChat } from '@/lib/db/queries';
import { getPostById } from '@/lib/db/posts-queries';
import { generateUUID } from '@/lib/utils';

const createChatSchema = z.object({
  postId: z.string(),
  topic: z.string().min(1, 'Topic is required'),
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
    const { postId, topic } = createChatSchema.parse(body);

    // Get the post template
    const postData = await getPostById(postId);
    if (!postData) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Create the chat
    const chat = await saveChat({
      id: generateUUID(),
      title: `LinkedIn Post: ${postData.title}`,
      userId,
      visibility: 'private',
    });

    return NextResponse.json({
      chatId: chat.id,
      postTitle: postData.title,
    });
  } catch (error) {
    console.error('Error creating chat from post:', error);
    
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