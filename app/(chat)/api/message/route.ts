import { auth } from '@clerk/nextjs/server';
import { deleteMessageById, getMessageById } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get('id');

  if (!messageId) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const { userId } = await auth();

  if (!userId) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  // Get the message to verify ownership
  const message = await getMessageById({ id: messageId });
  
  if (!message) {
    return new ChatSDKError('not_found:chat', 'Message not found').toResponse();
  }

  // Delete the message
  const deletedMessage = await deleteMessageById({ messageId });

  return Response.json(deletedMessage, { status: 200 });
}
