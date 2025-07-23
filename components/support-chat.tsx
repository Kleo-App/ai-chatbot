"use client"

import { useAuth } from '@clerk/nextjs'
import Script from 'next/script'

export function SupportChat() {
  const { isSignedIn } = useAuth()

  // Only render the chat for authenticated users
  if (!isSignedIn) {
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