'use client';

import { useState, useEffect } from 'react';

export function useCommandMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const toggle = () => setOpen(!open);
  const close = () => setOpen(false);

  return {
    open,
    setOpen,
    toggle,
    close,
  };
} 