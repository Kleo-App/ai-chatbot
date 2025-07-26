'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface LinkedInHook {
  id: number;
  source: string;
  content: string;
}

interface LinkedInHookContextType {
  selectedHook: LinkedInHook | null;
  setSelectedHook: (hook: LinkedInHook | null) => void;
  clearSelectedHook: () => void;
  isHookSelected: boolean;
}

// Utility functions for safe localStorage operations
const safeLocalStorage = {
  get: <T,>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error);
      return null;
    }
  },
  set: (key: string, value: any): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting ${key} in localStorage:`, error);
    }
  },
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
    }
  }
};

const STORAGE_KEY = 'selectedLinkedInHook';

const LinkedInHookContext = createContext<LinkedInHookContextType | undefined>(undefined);

export function LinkedInHookProvider({ children }: { children: ReactNode }) {
  // Use a stable initial state with lazy initialization to prevent unnecessary rerenders
  const [selectedHook, setSelectedHookState] = useState<LinkedInHook | null>(() => {
    // Only try to access localStorage during client-side rendering
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
      } catch (e) {
        console.error('Error reading from localStorage:', e);
        return null;
      }
    }
    return null;
  });
  
  // Track if component is mounted to prevent localStorage operations during SSR
  const [isMounted, setIsMounted] = useState(false);

  // Mark component as mounted
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Save to localStorage when hook changes (only after component is mounted)
  useEffect(() => {
    if (isMounted) {
      if (selectedHook) {
        safeLocalStorage.set(STORAGE_KEY, selectedHook);
      } else {
        safeLocalStorage.remove(STORAGE_KEY);
      }
    }
  }, [selectedHook, isMounted]);

  const setSelectedHook = (hook: LinkedInHook | null) => {
    setSelectedHookState(hook);
  };

  const clearSelectedHook = () => {
    setSelectedHookState(null);
  };

  return (
    <LinkedInHookContext.Provider 
      value={{ 
        selectedHook, 
        setSelectedHook, 
        clearSelectedHook,
        isHookSelected: !!selectedHook
      }}
    >
      {children}
    </LinkedInHookContext.Provider>
  );
}

export function useLinkedInHook() {
  const context = useContext(LinkedInHookContext);
  if (context === undefined) {
    throw new Error('useLinkedInHook must be used within a LinkedInHookProvider');
  }
  return context;
}
