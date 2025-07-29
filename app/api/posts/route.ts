import { auth } from '@clerk/nextjs/server';
import { getLatestDocumentsByUserId, deleteDocumentById } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new ChatSDKError('unauthorized:document').toResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'draft' | 'scheduled' | 'published' | null;

    const documents = await getLatestDocumentsByUserId({ 
      userId,
      status: status || undefined 
    });
    return Response.json(documents, { status: 200 });
  } catch (error) {
    return new ChatSDKError(
      'bad_request:database',
      'Failed to get user documents',
    ).toResponse();
  }
}

export async function DELETE(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new ChatSDKError('unauthorized:document').toResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new ChatSDKError(
        'bad_request:api',
        'Parameter id is required',
      ).toResponse();
    }

    const deletedDocuments = await deleteDocumentById({ id, userId });
    return Response.json(deletedDocuments, { status: 200 });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError(
      'bad_request:database',
      'Failed to delete document',
    ).toResponse();
  }
} 