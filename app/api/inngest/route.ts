import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import {
  scheduleLinkedInPost,
  publishLinkedInPost,
  cancelScheduledLinkedInPost,
} from '@/lib/inngest/functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    scheduleLinkedInPost,
    publishLinkedInPost,
    cancelScheduledLinkedInPost,
  ],
}); 