import { auth } from '@clerk/nextjs/server';
import { getLatestDocumentsByUserId } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new ChatSDKError('unauthorized:document').toResponse();
  }

  try {
    const documents = await getLatestDocumentsByUserId({ userId });
    return Response.json(documents, { status: 200 });
  } catch (error) {
    return new ChatSDKError(
      'bad_request:database',
      'Failed to get user documents',
    ).toResponse();
  }
} 