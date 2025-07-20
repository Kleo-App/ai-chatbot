'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import { GuestMultimodalInput } from '@/components/guest-multimodal-input';
import { AuthModal } from '@/components/auth-modal';
import { Footer } from '@/components/footer';

interface GreetingProps {
  children?: React.ReactNode; // For authenticated multimodal input
  isLoggedOut?: boolean; // Server-side indication that user is not authenticated
}

const HeartIcon = () => (
  <svg 
    viewBox="0 0 18 16" 
    className="w-4 h-4 fill-white" 
    preserveAspectRatio="none"
  >
    <path d="M9 15.5C9 15.5 1.5 10.5 1.5 5.5C1.5 3.5 3 2 5 2C6.5 2 8 3 9 4C10 3 11.5 2 13 2C15 2 16.5 3.5 16.5 5.5C16.5 10.5 9 15.5 9 15.5Z"/>
  </svg>
);

const StarIcon = () => (
  <svg className="w-4 h-4 fill-yellow-400" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
);

const testimonials = [
  {
    id: 1,
    name: "Lara Acosta",
    avatar: "/images/laura_headshot.png",
    content: "The best tool for LinkedIn content creation. Kleo has transformed how I approach social media marketing and saved me hours every week.",
    rating: 5
  },
  {
    id: 2,
    name: "Alexis Bertholf",
    avatar: "/images/jake_headshot.png",
    content: "Kleo is going to take over!! I've been using it for months and the AI-generated content is incredibly engaging and authentic.",
    rating: 5
  },
  {
    id: 3,
    name: "Eric Partaker",
    avatar: "/images/jake_headshot.png",
    content: "Little masterpiece right here. Watch this space - Kleo is revolutionizing content creation for professionals.",
    rating: 5
  },
  {
    id: 4,
    name: "Sarah Johnson",
    avatar: "/images/laura_headshot.png",
    content: "Game changer for my LinkedIn strategy! The content quality is outstanding and it feels so natural.",
    rating: 5
  },
  {
    id: 5,
    name: "Mike Chen",
    avatar: "/images/jake_headshot.png",
    content: "I was skeptical about AI content, but Kleo proved me wrong. It understands my voice perfectly.",
    rating: 5
  },
  {
    id: 6,
    name: "Emma Wilson",
    avatar: "/images/laura_headshot.png",
    content: "Absolutely love this tool! My engagement rates have doubled since I started using Kleo for my posts.",
    rating: 5
  },
  {
    id: 7,
    name: "David Rodriguez",
    avatar: "/images/jake_headshot.png",
    content: "The future of content creation is here. Kleo makes professional posting effortless and effective.",
    rating: 5
  },
  {
    id: 8,
    name: "Lisa Park",
    avatar: "/images/laura_headshot.png",
    content: "Can't imagine my LinkedIn strategy without Kleo now. It's become an essential part of my workflow.",
    rating: 5
  },
  {
    id: 9,
    name: "Alex Thompson",
    avatar: "/images/jake_headshot.png",
    content: "Brilliant tool that actually understands context and creates meaningful content. Highly recommend!",
    rating: 5
  }
];

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const targetDate = new Date('2025-08-05T00:00:00').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="flex items-center justify-center gap-2 text-blue-400 text-4xl md:text-5xl font-mono font-bold">
      <span>{formatNumber(timeLeft.days)}D</span>
      <span className="text-gray-500">:</span>
      <span>{formatNumber(timeLeft.hours)}H</span>
      <span className="text-gray-500">:</span>
      <span>{formatNumber(timeLeft.minutes)}M</span>
      <span className="text-gray-500">:</span>
      <span>{formatNumber(timeLeft.seconds)}S</span>
    </div>
  );
};

export const Greeting = ({ children, isLoggedOut }: GreetingProps) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { user, isLoaded } = useUser();

  // Show header immediately if server confirms user is logged out, otherwise wait for client-side check
  const showHeader = isLoggedOut || (!user && isLoaded);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    
    // Simulate API call - replace with actual waitlist API
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSubmitted(true);
      setEmail('');
    } catch (error) {
      console.error('Error submitting to waitlist:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={`flex flex-col ${children ? 'h-full' : 'min-h-screen'}`}>
        {/* Header - only show for unauthenticated users */}
        {showHeader && (
          <header className="shrink-0 w-full px-8 py-4">
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

        {/* Featured Testimonials Section - only show for unauthenticated users */}
        {showHeader && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full py-16"
          >
            <div className="max-w-5xl mx-auto px-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Jake's Testimonial */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start gap-4">
                    <Image
                      src="/images/jake_headshot.png"
                      alt="Jake Ward"
                      width={60}
                      height={60}
                      className="rounded-full flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon key={i} />
                        ))}
                      </div>
                      <blockquote className="text-gray-700 text-lg leading-relaxed mb-4 italic">
                        "I've paid writers, used AI, tried every tool. Nothing worked. So I built Kleo 2.0 to <span className="font-semibold text-gray-900">finally write like me</span>."
                      </blockquote>
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900">Jake Ward</div>
                        <div className="text-gray-600">Founder</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Lara's Testimonial */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start gap-4">
                    <Image
                      src="/images/laura_headshot.png"
                      alt="Lara Acosta"
                      width={60}
                      height={60}
                      className="rounded-full flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon key={i} />
                        ))}
                      </div>
                      <blockquote className="text-gray-700 text-lg leading-relaxed mb-4 italic">
                        "Most writing tools suck, so I co-founded one that doesn't. It writes like a <span className="font-semibold text-gray-900">top 0.1% ghostwriter</span> but thinks like me."
                      </blockquote>
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900">Lara Acosta</div>
                        <div className="text-gray-600">Co-founder</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Waitlist Section - only show for unauthenticated users */}
        {showHeader && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="w-full bg-gray-50 py-16"
          >
            <div className="max-w-4xl mx-auto px-8 text-center">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="text-3xl md:text-4xl font-medium text-gray-900 mb-4"
              >
                Join the waitlist to be selected for the next cohort of beta users
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto"
              >
                The first 500 creators are using Kleo 2.0 early. Beta feedback is insane. Next cohort opens in:
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="mb-8"
              >
                <CountdownTimer />
              </motion.div>

              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
                onSubmit={handleWaitlistSubmit}
                className="max-w-md mx-auto space-y-4"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isSubmitting || isSubmitted}
                />
                
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
                  disabled={isSubmitting || isSubmitted}
                >
                  {isSubmitted 
                    ? "✓ You&apos;re on the list!" 
                    : isSubmitting 
                      ? "Joining..." 
                      : "Join the next 500 creators"
                  }
                </Button>
              </motion.form>

              {isSubmitted && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-green-600 mt-4 font-medium"
                >
                  Thanks for joining! We&apos;ll notify you when your spot opens up.
                </motion.p>
              )}
            </div>
          </motion.div>
        )}

        {/* Testimonial Section - only show for unauthenticated users */}
        {showHeader && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="w-full bg-gray-900 py-16"
          >
            <div className="max-w-6xl mx-auto px-8">
              {/* Header Section */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-gray-700 mb-6">
                  <HeartIcon />
                  <span className="text-gray-100 text-xs font-bold tracking-widest uppercase">
                    The Wall of love
                  </span>
                </div>
                
                <h2 className="text-4xl md:text-5xl font-medium text-white mb-4">
                  Join 70,000+ users waiting for Kleo 2.0
                </h2>
                
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                  We are grateful for all the love Kleo has received so far. We really appreciate the support.
                </p>
              </div>

              {/* Testimonials Masonry Grid */}
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {testimonials.map((testimonial, index) => (
                  <motion.div
                    key={testimonial.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 + index * 0.1 }}
                    className="break-inside-avoid mb-6"
                  >
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:bg-gray-750 transition-colors duration-200">
                      {/* User Info */}
                      <div className="flex items-center gap-3 mb-4">
                        <Image
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <div>
                          <h4 className="text-white font-medium text-sm">
                            {testimonial.name}
                          </h4>
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <StarIcon key={i} />
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Testimonial Content */}
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {testimonial.content}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer - only show for unauthenticated users */}
        {showHeader && <Footer />}
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
