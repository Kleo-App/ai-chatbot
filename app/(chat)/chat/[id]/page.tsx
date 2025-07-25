import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';
import { Chat } from '@/components/chat';
import { getChatById, getMessagesByChatId, getDocumentById, saveChat } from '@/lib/db/queries';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { convertToUIMessages } from '@/lib/utils';

export default async function Page(props: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ documentId?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { id } = params;
  const { documentId } = searchParams;
  const { userId } = await auth();

  if (!userId) {
    redirect('/login');
  }

  // Always try to get existing chat first
  let chat = await getChatById({ id });
  let document = null;

  // If we have a documentId, fetch the document
  if (documentId) {
    document = await getDocumentById({ id: documentId });
    
    if (!document) {
      notFound();
    }

    if (document.userId !== userId) {
      return notFound();
    }
  }

  // If no chat exists, create one
  if (!chat) {
    const title = document ? `Edit: ${document.title}` : 'New Chat';
    
    await saveChat({
      id,
      userId,
      title,
      visibility: 'private',
    });

    chat = await getChatById({ id });
  }

  if (!chat) {
    notFound();
  }

  // Check permissions
  if (chat.visibility === 'private' && userId !== chat.userId) {
    return notFound();
  }

  // Create a session-like object for compatibility
  const session = {
    user: {
      id: userId,
      type: 'regular' as const,
    },
  };

  // ALWAYS fetch messages for this chat ID, regardless of when the chat was created
  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const uiMessages = convertToUIMessages(messagesFromDb);

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');

  if (!chatModelFromCookie) {
    return (
      <>
        <Chat
          id={chat.id}
          initialMessages={uiMessages}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType={chat.visibility}
          isReadonly={session?.user?.id !== chat.userId}
          session={session}
          autoResume={true}
          initialDocument={document}
          initialPinned={chat.pinned}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={uiMessages}
        initialChatModel={chatModelFromCookie.value}
        initialVisibilityType={chat.visibility}
        isReadonly={session?.user?.id !== chat.userId}
        session={session}
        autoResume={true}
        initialDocument={document}
        initialPinned={chat.pinned}
      />
      <DataStreamHandler />
    </>
  );
}
