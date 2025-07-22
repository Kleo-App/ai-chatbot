import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { PostsList } from '@/components/posts-list';

export default async function PostsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Your Posts</h1>
          <p className="mt-2 text-muted-foreground">
            View and edit all your generated content in one place
          </p>
        </div>
        <PostsList />
      </div>
    </div>
  );
} 