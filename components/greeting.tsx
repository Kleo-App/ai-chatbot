'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import { GuestMultimodalInput } from '@/components/guest-multimodal-input';
import { AuthModal } from '@/components/auth-modal';

// Lazy load heavy components for better initial load performance
const LazyFooter = lazy(() => import('@/components/footer').then(mod => ({ default: mod.Footer })));

interface GreetingProps {
  children?: React.ReactNode; // For authenticated multimodal input
  isLoggedOut?: boolean; // Server-side indication that user is not authenticated
}

const HeartIcon = () => (
  <svg 
    viewBox="0 0 18 16" 
    className="size-4 fill-white" 
    preserveAspectRatio="none"
  >
    <path d="M9 15.5C9 15.5 1.5 10.5 1.5 5.5C1.5 3.5 3 2 5 2C6.5 2 8 3 9 4C10 3 11.5 2 13 2C15 2 16.5 3.5 16.5 5.5C16.5 10.5 9 15.5 9 15.5Z"/>
  </svg>
);

const StarIcon = () => (
  <svg className="size-4 fill-yellow-400" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
);

// Stack icon for AI Badge
const StackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="dark:fill-white fill-[#364153]">
    <path d="M7.62758 1.09876C7.74088 1.03404 7.8691 1 7.99958 1C8.13006 1 8.25828 1.03404 8.37158 1.09876L13.6216 4.09876C13.7363 4.16438 13.8316 4.25915 13.8979 4.37347C13.9642 4.48779 13.9992 4.6176 13.9992 4.74976C13.9992 4.88191 13.9642 5.01172 13.8979 5.12604C13.8316 5.24036 13.7363 5.33513 13.6216 5.40076L8.37158 8.40076C8.25828 8.46548 8.13006 8.49952 7.99958 8.49952C7.8691 8.49952 7.74088 8.46548 7.62758 8.40076L2.37758 5.40076C2.26287 5.33513 2.16753 5.24036 2.10123 5.12604C2.03492 5.01172 2 4.88191 2 4.74976C2 4.6176 2.03492 4.48779 2.10123 4.37347C2.16753 4.25915 2.26287 4.16438 2.37758 4.09876L7.62758 1.09876Z" />
    <path d="M2.56958 7.23928L2.37758 7.34928C2.26287 7.41491 2.16753 7.50968 2.10123 7.624C2.03492 7.73831 2 7.86813 2 8.00028C2 8.13244 2.03492 8.26225 2.10123 8.37657C2.16753 8.49089 2.26287 8.58566 2.37758 8.65128L7.62758 11.6513C7.74088 11.716 7.8691 11.75 7.99958 11.75C8.13006 11.75 8.25828 11.716 8.37158 11.6513L13.6216 8.65128C13.7365 8.58573 13.8321 8.49093 13.8986 8.3765C13.965 8.26208 14 8.13211 14 7.99978C14 7.86745 13.965 7.73748 13.8986 7.62306C13.8321 7.50864 13.7365 7.41384 13.6216 7.34828L13.4296 7.23828L9.11558 9.70328C8.77568 9.89744 8.39102 9.99956 7.99958 9.99956C7.60814 9.99956 7.22347 9.89744 6.88358 9.70328L2.56958 7.23928Z" />
    <path d="M2.37845 10.5993L2.57045 10.4893L6.88445 12.9533C7.22435 13.1474 7.60901 13.2496 8.00045 13.2496C8.39189 13.2496 8.77656 13.1474 9.11645 12.9533L13.4305 10.4883L13.6225 10.5983C13.7374 10.6638 13.833 10.7586 13.8994 10.8731C13.9659 10.9875 14.0009 11.1175 14.0009 11.2498C14.0009 11.3821 13.9659 11.5121 13.8994 11.6265C13.833 11.7409 13.7374 11.8357 13.6225 11.9013L8.37245 14.9013C8.25915 14.966 8.13093 15 8.00045 15C7.86997 15 7.74175 14.966 7.62845 14.9013L2.37845 11.9013C2.2635 11.8357 2.16795 11.7409 2.10148 11.6265C2.03501 11.5121 2 11.3821 2 11.2498C2 11.1175 2.03501 10.9875 2.10148 10.8731C2.16795 10.7586 2.2635 10.6638 2.37845 10.5983V10.5993Z" />
  </svg>
);

// Send icon for form submit
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send" aria-hidden="true">
    <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
    <path d="m21.854 2.147-10.94 10.939" />
  </svg>
);

const testimonials = [
  {
    id: 1,
    name: "Lara Acosta",
    avatar: "/images/avatars/lara-acosta.png",
    content: "The best tool for LinkedIn content creation. Take my word for it. I don't use many tools for content, but this one is a must. The fact that it's created by a content creator sold it for me too. It's obvious by its simplicity and reliability. +60,000 followers in < 5 months too since using it. Couldn't recommend it more, a must have for anyone looking to become a better writer and grow on LinkedIn.",
    rating: 5,
    date: "Oct 9, 2023"
  },
  {
    id: 2,
    name: "Alexis Bertholf",
    avatar: "/images/avatars/alexis-bertholf.png",
    content: "Kleo is going to take over!! I've been using it for 2 weeks and LOVE it. I LOVE using Kleo for idea gen - it's making my search 10000x easier. Thank you for this!!",
    rating: 5,
    date: "Nov 9, 2023"
  },
  {
    id: 3,
    name: "Eric Partaker",
    avatar: "/images/avatars/eric-partaker.png",
    content: "Little masterpiece right here. Watch everyone else's LinkedIn presence transform! Love the tool. Great job.",
    rating: 5,
    date: "Oct 6, 2023"
  },
  {
    id: 4,
    name: "Chimasha Induni",
    avatar: "/images/avatars/chimasha-induni.png",
    content: "Love Kleo. Thanks so much.",
    rating: 5,
    date: "Jul 26, 2024"
  },
  {
    id: 5,
    name: "Amy Misnik",
    avatar: "/images/avatars/amy-misnik.png",
    content: "This is such an incredible tool!",
    rating: 5,
    date: "Jul 26, 2024"
  },
  {
    id: 6,
    name: "Christine Attieh",
    avatar: "/images/avatars/christine-attieh.png",
    content: "I use Kleo and its by far best tool I am using. And everyday!",
    rating: 5,
    date: "Jul 26, 2024"
  },
  {
    id: 7,
    name: "Zachary Laughlin",
    avatar: "/images/avatars/zachary-laughlin.png",
    content: "Goldmine tool!",
    rating: 5,
    date: "Jul 26, 2024"
  },
  {
    id: 8,
    name: "Mezbah Zohan",
    avatar: "/images/avatars/mezbah-zohan.png",
    content: "It is so damn good and it's free! SO I use it daily, and recommend it to everyone.",
    rating: 5,
    date: "Jul 26, 2024"
  },
  {
    id: 9,
    name: "Hrabren Bankov",
    avatar: "/images/avatars/hrabren-bankov.png",
    content: "One of the most valuable tools out there! 👏",
    rating: 5,
    date: "Jul 26, 2024"
  },
  {
    id: 10,
    name: "Christopher Panteli",
    avatar: "/images/avatars/christopher-panteli.png",
    content: "Great tool!",
    rating: 5,
    date: "Jul 26, 2024"
  },
  {
    id: 11,
    name: "Sami Sharaf",
    avatar: "/images/avatars/sami-sharaf.png",
    content: "It's one of the best ones tbh!",
    rating: 5,
    date: "Jul 26, 2024"
  },
  {
    id: 12,
    name: "Sawyer McGuire",
    avatar: "/images/avatars/sawyer-mcguire.png",
    content: "Kleo has been such a gift on here!",
    rating: 5,
    date: "Jul 26, 2024"
  },
  {
    id: 13,
    name: "Imran Khushal",
    avatar: "/images/avatars/imran-khushal.png",
    content: "I tried Kleo and it's fantastic! Not only does it help you format your posts perfectly for mobile, but it also lets you see what's trending. It's been a game-changer for my content strategy. Thanks for creating such an awesome tool!",
    rating: 5,
    date: "Jul 26, 2024"
  },
  {
    id: 14,
    name: "Twinkle Chaterjee",
    avatar: "/images/avatars/twinkle-chaterjee.png",
    content: "Kleo is one of the best. Period!",
    rating: 5,
    date: "Jul 26, 2024"
  },
  {
    id: 15,
    name: "Maria Dykstra",
    avatar: "/images/avatars/maria-dykstra.png",
    content: "Great tool. A must have for anyone who is serious about elevating their LinkedIn game!",
    rating: 5,
    date: "Jul 26, 2024"
  },
  {
    id: 16,
    name: "Ker Vang",
    avatar: "/images/avatars/ker-vang.png",
    content: "I have been recommending Kleo to everyone. It is the best tool my team have used for LinkedIn and we have you to thank for it!",
    rating: 5,
    date: "Jul 26, 2024"
  },
  {
    id: 17,
    name: "Lenard Adanov",
    avatar: "/images/avatars/lenard-adanov.png",
    content: "Can't say I've used too many tools to help me out on LinkedIn but this may just have me hooked...",
    rating: 5,
    date: "Jul 26, 2024"
  },
  {
    id: 18,
    name: "Ghazlan Atqiya Firmansyah",
    avatar: "/images/avatars/ghazlan-atqiya-firmansyah.png",
    content: "Kleo is the best tool I've ever used on LinkedIn. I really loved this tool in helping me format my posts!",
    rating: 5,
    date: "Jul 26, 2024"
  },
  {
    id: 19,
    name: "Ayesha Mansha",
    avatar: "/images/avatars/ayesha-mansha.png",
    content: "I have been using Kleo, it's super fantastic!",
    rating: 5,
    date: "Jul 26, 2024"
  },
  {
    id: 20,
    name: "Komal Mane",
    avatar: "/images/avatars/komal-mane.png",
    content: "I have used Kleo and I can proudly say this is one of the best tools I have ever used.",
    rating: 5,
    date: "Jul 26, 2024"
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
    const targetDate = new Date('2025-08-14T00:00:00').getTime();

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
  const [message, setMessage] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isBurstAnimated, setIsBurstAnimated] = useState(false);
  const { user, isLoaded } = useUser();

  // Handle scroll detection for sticky header
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Trigger blue burst animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBurstAnimated(true);
    }, 300); // Small delay to ensure page is loaded

    return () => clearTimeout(timer);
  }, []);

  // Early return for authenticated users - skip all logged-out specific logic
  if (children) {
    return (
      <div className="flex flex-col h-full">
        {children}
      </div>
    );
  }

  // Scroll to waitlist section
  const scrollToWaitlist = () => {
    const waitlistSection = document.getElementById('waitlist');
    if (waitlistSection) {
      waitlistSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Optimized rendering logic:
  // - If server confirms user is logged out, show landing page immediately 
  // - Otherwise, wait for client-side auth check (fallback for edge cases)
  const shouldShowLandingPage = isLoggedOut === true || (!user && isLoaded);
  const shouldShowHeader = shouldShowLandingPage;

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsSubmitted(true);
        setEmail('');
        
        // Set appropriate message based on response
        if (data.updated) {
          setMessage(data.message || "You're already on the waitlist! We'll be in touch soon.");
        } else {
          setMessage("Thanks for joining! We'll be in touch soon.");
        }
      } else {
        throw new Error('Failed to submit to waitlist');
      }
    } catch (error) {
      console.error('Error submitting to waitlist:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={`flex flex-col ${children ? 'h-full' : 'min-h-screen'}`}>
        {/* Header - only show for unauthenticated users */}
        {shouldShowHeader && (
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
                <Button 
                  onClick={scrollToWaitlist}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Join Waitlist
                </Button>
              </nav>
            </div>
          </header>
        )}

        {/* Hero Section */}
        {shouldShowLandingPage ? (
          <section id="hero" className="w-full relative">
            <div className="relative flex flex-col items-center w-full px-6">
              {/* Background with gradient - extends to full height */}
              <div className="absolute inset-0 -top-20 -z-10">
                <div className="absolute inset-0 h-[1800px] w-full bg-gradient-radial from-white via-blue-50/80 to-purple-100/60" />
                {/* Blue sunburst from bottom */}
                <div 
                  className={`absolute inset-0 w-full h-[1800px] opacity-90 transition-all duration-1000 ease-out origin-center ${
                    isBurstAnimated ? 'scale-100 opacity-90' : 'scale-50 opacity-0'
                  }`}
                  style={{
                    background: `radial-gradient(ellipse 80% 40% at 50% 60%, rgb(21, 125, 253) 0%, rgba(21, 125, 253, 0.7) 35%, rgba(21, 125, 253, 0.3) 60%, transparent 85%)`,
                    transformOrigin: '50% 60%'
                  }}
                />
                {/* Fade to transparent at bottom */}
                <div 
                  className="absolute inset-0 w-full h-[1800px]"
                  style={{
                    background: `linear-gradient(to bottom, transparent 0%, transparent 85%, rgba(255, 255, 255, 0.2) 92%, rgba(255, 255, 255, 0.6) 96%, rgba(255, 255, 255, 0.9) 98%, transparent 100%)`
                  }}
                />
              </div>
              
              {/* Main hero content */}
              <div className="relative z-10 pt-24 pb-48 max-w-3xl mx-auto w-full flex flex-col gap-6 items-center">


                {/* Main heading */}
                <div className="flex flex-col items-center justify-center gap-5">
                  <h1 className="text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-medium tracking-tighter text-balance text-center text-primary">
                    Kleo 2.0 thinks like you,<br />
                    <span className="inline-block">
                      <span className="inline-flex items-center">
                        <span style={{ marginRight: '0.2em' }}>but writes </span>
                        <span style={{ color: 'rgb(21, 125, 253)' }}>better content</span>
                      </span>
                    </span>
                  </h1>
                  
                  <p className="text-base md:text-lg text-center text-muted-foreground font-medium text-balance leading-relaxed tracking-tight">
                    Your{' '}
                    <span className="inline-flex items-center gap-1 bg-blue-100 px-2 py-0.5 rounded-md font-semibold text-black">
                      <Image
                        src="/images/LI-In-Bug.png"
                        alt="LinkedIn"
                        width={20}
                        height={20}
                        className="inline-block shrink-0"
                        priority
                        sizes="20px"
                      />
                      LinkedIn
                    </span>{' '}
                    AI ghostwriter trained by top creators for creators.
                  </p>
                </div>

                {/* Chat input */}
                <div className="relative mt-4 w-full max-w-3xl mx-auto">
                  <div className="[&_textarea]:text-lg [&_textarea]:min-h-[120px] [&_textarea]:p-6 [&_.bg-white]:shadow-2xl [&_.rounded-2xl]:rounded-3xl">
                    <GuestMultimodalInput 
                      onTriggerAuth={() => setShowAuthModal(true)}
                    />
                  </div>
                </div>
              </div>
            </div>
            

          </section>
        ) : (
          /* Authenticated User - Direct render without padding */
          children || (
            <div className="flex items-center justify-center h-full">
              <GuestMultimodalInput 
                onTriggerAuth={() => setShowAuthModal(true)}
              />
            </div>
          )
        )}

        {/* Rest of the sections remain the same for logged-out users */}
        {/* Container for testimonials and rest of site - only show for unauthenticated users */}
        {shouldShowHeader && (
          <div className="w-full relative z-20 -mt-24 px-8">
            <div className="flex w-full flex-col gap-12 rounded-[20px] bg-background p-8">
            {/* Featured Testimonials Section */}
            <div className="w-full">
              <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Jake's Testimonial */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-start gap-4">
                      <Image
                        src="/images/jake_headshot.png"
                        alt="Jake Ward"
                        width={60}
                        height={60}
                        className="rounded-full shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon key={i} />
                          ))}
                        </div>
                        <blockquote className="text-gray-700 text-lg leading-relaxed mb-4 italic">
                          &ldquo;I&rsquo;ve paid writers, used AI, tried every tool. Nothing worked. So I built Kleo 2.0 to <span className="font-semibold text-gray-900">finally write like me</span>.&rdquo;
                        </blockquote>
                        <div className="text-sm">
                          <div className="font-semibold text-gray-900">Jake Ward</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lara's Testimonial */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-start gap-4">
                      <Image
                        src="/images/laura_headshot.png"
                        alt="Lara Acosta"
                        width={60}
                        height={60}
                        className="rounded-full shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon key={i} />
                          ))}
                        </div>
                        <blockquote className="text-gray-700 text-lg leading-relaxed mb-4 italic">
                          &ldquo;Most writing tools suck, so I co-founded one that doesn&rsquo;t. It writes like a <span className="font-semibold text-gray-900">top 0.1% ghostwriter</span> but thinks like me.&rdquo;
                        </blockquote>
                        <div className="text-sm">
                          <div className="font-semibold text-gray-900">Lara Acosta</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Waitlist Section */}
            <div id="waitlist" className="w-full py-16">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-medium text-gray-900 mb-4">
                  Join the waitlist to be selected for the <br /> next cohort of beta users
                </h2>
                
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  The first 500 creators are using Kleo 2.0 early.<br />
                  Next cohort opens in:
                </p>

                <div className="mb-8">
                  <CountdownTimer />
                </div>

                <form
                  onSubmit={handleWaitlistSubmit}
                  className="max-w-md mx-auto space-y-4"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      ? "✓ Success!" 
                      : isSubmitting 
                        ? "Joining..." 
                        : "Join the next 500 creators"
                    }
                  </Button>
                  
                  {isSubmitted && message && (
                    <p className="text-green-600 text-sm text-center mt-2">
                      {message}
                    </p>
                  )}
                </form>

                {isSubmitted && (
                  <p className="text-green-600 mt-4 font-medium">
                    Thanks for joining! We&rsquo;ll notify you when your spot opens up.
                  </p>
                )}
              </div>
            </div>

            {/* Testimonial Section */}
            <div className="bg-gray-900 py-16 -mb-8 rounded-b-[20px]" style={{ width: 'calc(100% + 4rem)', marginLeft: '-2rem', marginRight: '-2rem' }}>
              <div className="max-w-7xl mx-auto px-8">
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
                  {testimonials.map((testimonial) => (
                    <div
                      key={testimonial.id}
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
                          <div className="flex-1">
                            <h4 className="text-white font-medium text-sm">
                              {testimonial.name}
                            </h4>
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(testimonial.rating)].map((_, i) => (
                                <StarIcon key={i} />
                              ))}
                            </div>
                            {testimonial.date && (
                              <p className="text-gray-500 text-xs mt-1">
                                {testimonial.date}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Testimonial Content */}
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {testimonial.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            </div>
          </div>
        )}

        {/* Footer in separate container - only show for unauthenticated users */}
        {shouldShowHeader && (
          <div className="w-full relative z-20 px-8 mt-6 mb-8">
            <div className="w-full rounded-[20px] border-2 border-gray-200 bg-background dark:border-gray-800 overflow-hidden">
              <Suspense fallback={<div className="h-32 animate-pulse bg-gray-100" />}>
                <LazyFooter />
              </Suspense>
            </div>
          </div>
        )}
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
