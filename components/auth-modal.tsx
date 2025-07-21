'use client';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
        setIsSubmitted(true);
        setEmail('');
      } else {
        throw new Error('Failed to submit to waitlist');
      }
    } catch (error) {
      console.error('Error submitting to waitlist:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="size-5 text-gray-500" />
          </button>

          <div className="p-8 text-center">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Ready to create amazing content?
              </h2>
              <p className="text-gray-600">
                Kleo is currently inviting members in batches to have early access. Want to be one of the first? <br /> Sign up below.
              </p>
            </div>

            {/* Waitlist Form */}
            {!isSubmitted ? (
              <form onSubmit={handleWaitlistSubmit} className="space-y-4 mb-6">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isSubmitting}
                />
                
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Joining..." : "Join the next 500 creators"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">✓ You&apos;re on the list!</p>
                  <p className="text-green-600 text-sm mt-1">
                    We&apos;ll notify you when your spot opens up.
                  </p>
                </div>
                <Button
                  onClick={onClose}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            )}

            {/* Divider */}
            {!isSubmitted && (
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500">Already a member?</span>
                </div>
              </div>
            )}

            {/* Existing User Actions */}
            {!isSubmitted && (
              <div className="space-y-3">
                <Button asChild variant="outline" size="lg" className="w-full">
                  <Link href="/login">
                    Sign In
                  </Link>
                </Button>
              </div>
            )}


          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
} 