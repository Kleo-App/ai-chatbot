'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

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

export const WaitlistSection = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState('');

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
    <div id="waitlist" className="w-full py-16 px-8 bg-gray-50">
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
  );
};