import { auth, currentUser } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { getChatsByUserId, getOrCreateUser } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Number.parseInt(searchParams.get('limit') || '10');
  const startingAfter = searchParams.get('starting_after');
  const endingBefore = searchParams.get('ending_before');

  if (startingAfter && endingBefore) {
    return new ChatSDKError(
      'bad_request:api',
      'Only one of starting_after or ending_before can be provided.',
    ).toResponse();
  }

  const { userId } = await auth();

  if (!userId) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  // Get the current user from Clerk to access email
  const user = await currentUser();
  if (!user || !user.emailAddresses?.[0]?.emailAddress) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  // Ensure user exists in local database
  await getOrCreateUser({
    id: userId,
    email: user.emailAddresses[0].emailAddress,
  });

  const chats = await getChatsByUserId({
    id: userId,
    limit,
    startingAfter,
    endingBefore,
  });

  return Response.json(chats);
}
