'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface LoggedOutHeaderProps {
  showJoinWaitlist?: boolean;
}

export const LoggedOutHeader = ({ showJoinWaitlist = true }: LoggedOutHeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll detection for sticky header
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to waitlist section (for homepage)
  const scrollToWaitlist = () => {
    const waitlistSection = document.getElementById('waitlist');
    if (waitlistSection) {
      waitlistSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <header 
      className={`fixed top-0 inset-x-0 w-full px-8 py-3 z-50 transition-all duration-300 ease-out ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-lg border-b border-gray-200/50' 
          : 'bg-transparent'
      }`}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
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
          <Button asChild variant="ghost" className="text-gray-700 hover:bg-gray-100">
            <Link href="/login">
              Sign In
            </Link>
          </Button>
          {showJoinWaitlist ? (
            <Button 
              onClick={scrollToWaitlist}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Join Waitlist
            </Button>
          ) : (
            <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
              <Link href="/register">
                Get Started
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}; 