'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import type { DataUIPart } from 'ai';
import type { CustomUIDataTypes } from '@/lib/types';

interface DataStreamContextValue {
  dataStream: DataUIPart<CustomUIDataTypes>[];
  setDataStream: React.Dispatch<
    React.SetStateAction<DataUIPart<CustomUIDataTypes>[]>
  >;
}

const DataStreamContext = createContext<DataStreamContextValue | null>(null);

export function DataStreamProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dataStream, setDataStream] = useState<DataUIPart<CustomUIDataTypes>[]>(
    [],
  );

  const value = useMemo(() => ({ dataStream, setDataStream }), [dataStream]);

  return (
    <DataStreamContext.Provider value={value}>
      {children}
    </DataStreamContext.Provider>
  );
}

export function useDataStream() {
  const context = useContext(DataStreamContext);
  if (!context) {
    throw new Error('useDataStream must be used within a DataStreamProvider');
  }
  
  // Add event listener for append-message events
  React.useEffect(() => {
    const handleAppendMessage = (event: CustomEvent<{ message: string }>) => {
      console.log('[data-stream-provider] Append message event received:', event.detail.message);
      context.setDataStream(prev => [
        ...prev,
        {
          type: 'data-appendMessage',
          data: event.detail.message,
          transient: true
        }
      ]);
      console.log('[data-stream-provider] Updated data stream with append message');
    };
    
    // Add event listener
    document.addEventListener('append-message', handleAppendMessage as EventListener);
    
    // Clean up
    return () => {
      document.removeEventListener('append-message', handleAppendMessage as EventListener);
    };
  }, [context]);
  
  return context;
}
