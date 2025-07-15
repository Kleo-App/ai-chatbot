import { WebhookEvent } from '@clerk/nextjs/server';
import { createOnboarding } from '@/lib/db/onboarding-queries';
import { headers } from 'next/headers';

// This endpoint handles Clerk webhooks for user creation
export async function POST(req: Request) {
  // For local development without svix, we can create onboarding records directly
  // Get the body
  const payload = await req.json();
  
  // Check if this is a user.created event
  if (payload.type === 'user.created' && payload.data && payload.data.id) {
    const userId = payload.data.id;
    
    try {
      // Create an onboarding record for the new user
      await createOnboarding(userId);
      console.log(`Created onboarding record for user ${userId}`);
      return new Response('Onboarding record created', { status: 200 });
    } catch (error) {
      console.error('Error creating onboarding record:', error);
      return new Response('Error creating onboarding record', { status: 500 });
    }
  }

  return new Response('Webhook received', { status: 200 });
}
