'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
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
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="p-8 text-center">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Ready to create amazing content?
              </h2>
              <p className="text-gray-600">
                Sign up or log in to start creating engaging LinkedIn posts with AI
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button asChild size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                <Link href="/register">
                  Get Started Free
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link href="/login">
                  Sign In
                </Link>
              </Button>
            </div>

            {/* Footer */}
            <p className="text-xs text-gray-500 mt-6">
              By signing up, you agree to create better LinkedIn content with AI assistance
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
} 