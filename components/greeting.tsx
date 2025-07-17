'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import { GuestMultimodalInput } from '@/components/guest-multimodal-input';
import { AuthModal } from '@/components/auth-modal';

interface GreetingProps {
  children?: React.ReactNode; // For authenticated multimodal input
}

export const Greeting = ({ children }: GreetingProps) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, isLoaded } = useUser();

  // If user is authenticated (client-side check), don't show the header
  const showHeader = !user && isLoaded;

  return (
    <>
      <div className={`flex flex-col ${children ? 'h-full' : 'h-screen'}`}>
        {/* Header - only show for unauthenticated users */}
        {showHeader && (
          <header className="flex-shrink-0 w-full px-8 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center">
                <Image
                  src="/images/kleo.svg"
                  alt="Kleo"
                  width={107}
                  height={32}
                  className="h-8 w-auto"
                />
              </Link>
              <nav className="flex items-center space-x-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">
                    Sign In
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">
                    Get Started
                  </Link>
                </Button>
              </nav>
            </div>
          </header>
        )}

        {/* Hero Section */}
        <div className={`flex-1 flex items-start justify-center px-8 ${user ? 'pt-0' : 'pt-16'} pb-12`}>
          <div className="w-full mx-auto text-center">
            <div className="max-w-3xl mx-auto">
              {showHeader && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6"
                >
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full text-gray-600 text-sm font-medium" style={{ backgroundColor: '#157DFF20' }}>
                    Over 70k users
                  </div>
                </motion.div>
              )}
              
              {/* Show Kleo logo when authenticated, otherwise show title and subtitle */}
              {user ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.3 }}
                  className="mb-8"
                >
                  <Image
                    src="/images/kleo.svg"
                    alt="Kleo"
                    width={107}
                    height={32}
                    className="h-8 w-auto mx-auto"
                  />
                </motion.div>
              ) : (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl md:text-5xl font-medium text-gray-900 mb-2"
                  >
                    Post engaging content
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl text-gray-600 flex items-center gap-2 flex-wrap justify-center mb-4"
                  >
                    <span>Create the best content for</span>
                    <span className="inline-flex items-center gap-1 relative top-px bg-blue-100 px-1.5 py-1 rounded font-medium">
                      <Image
                        src="/images/LI-In-Bug.png"
                        alt="LinkedIn"
                        width={20}
                        height={20}
                        className="inline-block"
                      />
                      LinkedIn
                    </span>
                    <span>in minutes by chatting with AI</span>
                  </motion.div>
                </>
              )}
            </div>

            {/* Input Section - now part of hero */}
            <div className="w-full md:max-w-3xl mx-auto px-4 mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {children || (
                  <GuestMultimodalInput 
                    onTriggerAuth={() => setShowAuthModal(true)}
                  />
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal - only show if using guest input */}
      {!children && (
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      )}
    </>
  );
};
