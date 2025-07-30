import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'kleo-linkedin-scheduler',
  name: 'Kleo LinkedIn Scheduler',
  eventKey: process.env.INNGEST_EVENT_KEY,
}); 