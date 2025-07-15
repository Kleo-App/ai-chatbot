import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '@clerk/nextjs/server';

import Script from 'next/script';
import { DataStreamProvider } from '@/components/data-stream-provider';
import { Background } from '@/components/background';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  // For unauthenticated users, show full-width layout without sidebar or header
  // (header is now integrated into the Greeting component)
  if (!userId) {
    return (
      <>
        <Background />
        <DataStreamProvider>
          {children}
        </DataStreamProvider>
      </>
    );
  }

  // For authenticated users, show the sidebar layout
  return (
    <>
      <Background />
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <SidebarProvider defaultOpen={!isCollapsed}>
          <AppSidebar />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </DataStreamProvider>
    </>
  );
}
