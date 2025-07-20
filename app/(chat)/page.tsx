import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { Greeting } from '@/components/greeting';

export default async function Page() {
  const { userId } = await auth();

  // If user is not logged in, show the greeting/landing page
  if (!userId) {
    return <Greeting isLoggedOut={true} />;
  }

  // Check if user has completed onboarding
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const onboardingComplete = clerkUser.publicMetadata?.onboardingComplete;

    // If onboarding is not complete, redirect to onboarding
    if (!onboardingComplete) {
      // Also ensure user profile exists in our database
      try {
        const { getOrCreateUserProfile } = await import('@/lib/db/profile-queries');
        await getOrCreateUserProfile(userId);
      } catch (dbError) {
        console.log(`[Homepage] Could not ensure user profile for ${userId}:`, dbError);
      }
      
      redirect('/onboarding/welcome');
    }
  } catch (error) {
    console.error(`[Homepage] Error checking onboarding status for user ${userId}:`, error);
    // If we can't check Clerk, fallback to database check
    try {
      const { getUserProfileByUserId } = await import('@/lib/db/profile-queries');
      const profile = await getUserProfileByUserId(userId);
      
      if (!profile || !profile.onboardingCompleted) {
        redirect('/onboarding/welcome');
      }
    } catch (dbError) {
      console.error(`[Homepage] Error checking database onboarding status:`, dbError);
      // As last resort, redirect to onboarding to be safe
      redirect('/onboarding/welcome');
    }
  }

  // Create a session-like object for compatibility
  const session = {
    user: {
      id: userId,
      type: 'regular' as const,
    },
  };

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={session}
          autoResume={false}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={modelIdFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler />
    </>
  );
}
