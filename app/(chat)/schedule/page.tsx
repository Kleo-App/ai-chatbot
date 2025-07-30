import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ScheduleCalendar } from '@/components/schedule-calendar';

export default async function SchedulePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/login');
  }

  return (
    <div className="size-full">
      <ScheduleCalendar />
    </div>
  );
} 