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

const LinkedInHookContext = createContext<LinkedInHookContextType | undefined>(undefined);

export function LinkedInHookProvider({ children }: { children: ReactNode }) {
  const [selectedHook, setSelectedHookState] = useState<LinkedInHook | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedHook = localStorage.getItem('selectedLinkedInHook');
      if (savedHook) {
        setSelectedHookState(JSON.parse(savedHook));
      }
    } catch (error) {
      console.error('Error loading selected LinkedIn hook from localStorage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage when hook changes
  useEffect(() => {
    if (isLoaded && selectedHook) {
      try {
        localStorage.setItem('selectedLinkedInHook', JSON.stringify(selectedHook));
      } catch (error) {
        console.error('Error saving selected LinkedIn hook to localStorage:', error);
      }
    }
  }, [selectedHook, isLoaded]);

  const setSelectedHook = (hook: LinkedInHook | null) => {
    setSelectedHookState(hook);
    if (!hook) {
      try {
        localStorage.removeItem('selectedLinkedInHook');
      } catch (error) {
        console.error('Error removing selected LinkedIn hook from localStorage:', error);
      }
    }
  };

  const clearSelectedHook = () => {
    setSelectedHookState(null);
    try {
      localStorage.removeItem('selectedLinkedInHook');
    } catch (error) {
      console.error('Error removing selected LinkedIn hook from localStorage:', error);
    }
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
