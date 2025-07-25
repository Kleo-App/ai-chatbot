"use client"

import { useAuth } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

export function SupportChat() {
  const { isSignedIn } = useAuth()
  const pathname = usePathname()

  // Only render the chat for authenticated users
  if (!isSignedIn) {
    return null
  }

  // Hide the widget on chat pages (routes like /chat/[id])
  // Keep it visible on homepage (/) and other pages
  const isOnChatPage = pathname.startsWith('/chat/')
  if (isOnChatPage) {
    return null
  }

  return (
    <>
      <Script
        id="fernand-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function (w){
              if (typeof w.Fernand !== "function") {
                var f = function () {
                  f.q[arguments[0] == 'set' ? 'unshift' : 'push'](arguments);
                };
                f.q = [];
                w.Fernand = f;
              }
            })(window);
            Fernand('init', { appId: 'kleo' });
          `,
        }}
      />
      <Script
        src="https://messenger.getfernand.com/client.js"
        strategy="afterInteractive"
      />
    </>
  )
} 