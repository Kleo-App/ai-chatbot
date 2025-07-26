'use client';

import { useEffect, useRef } from 'react';
import { artifactDefinitions } from './artifact';
import { initialArtifactData, useArtifact } from '@/hooks/use-artifact';
import { useDataStream } from './data-stream-provider';
import { UIArtifact } from './artifact';

export function DataStreamHandler() {
  const { dataStream } = useDataStream();

  const { artifact, setArtifact, setMetadata } = useArtifact();
  const lastProcessedIndex = useRef(-1);

  useEffect(() => {
    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    newDeltas.forEach((delta) => {
      const artifactDefinition = artifactDefinitions.find(
        (artifactDefinition) => artifactDefinition.kind === artifact.kind,
      );

      if (artifactDefinition?.onStreamPart) {
        artifactDefinition.onStreamPart({
          streamPart: delta,
          setArtifact,
          setMetadata,
        });
      }

      setArtifact((draftArtifact) => {
        if (!draftArtifact) {
          return { ...initialArtifactData, status: 'streaming' };
        }

        switch (delta.type) {
          case 'data-id':
            return {
              ...draftArtifact,
              documentId: delta.data,
              status: 'streaming',
            };

          case 'data-title':
            return {
              ...draftArtifact,
              title: delta.data,
              status: 'streaming',
            };

          case 'data-kind':
            return {
              ...draftArtifact,
              kind: delta.data,
              status: 'streaming',
            };

          case 'data-clear':
            return {
              ...draftArtifact,
              content: '',
              status: 'streaming',
            };

          case 'data-finish':
            return {
              ...draftArtifact,
              status: 'idle',
            };
            
          case 'data-linkedin-hooks':
            console.log('[DataStreamHandler] Processing LinkedIn hooks:', JSON.stringify(delta.data));
            console.log('[DataStreamHandler] Hook data type:', typeof delta.data);
            console.log('[DataStreamHandler] Hook data is array:', Array.isArray(delta.data));
            
            if (Array.isArray(delta.data)) {
              console.log('[DataStreamHandler] Number of hooks:', delta.data.length);
              delta.data.forEach((hook, index) => {
                console.log(`[DataStreamHandler] Hook ${index + 1}:`, JSON.stringify(hook));
                console.log(`[DataStreamHandler] Hook ${index + 1} has id:`, hook.id);
                console.log(`[DataStreamHandler] Hook ${index + 1} has source:`, hook.source);
                console.log(`[DataStreamHandler] Hook ${index + 1} has content:`, hook.content);
              });
            }
            
            // Store the hooks in the artifact data for rendering
            const updatedArtifact: UIArtifact = {
              ...draftArtifact,
              linkedInHooks: delta.data,
              status: 'streaming' as const,
            };
            
            console.log('[DataStreamHandler] Updated artifact with hooks:', JSON.stringify(updatedArtifact.linkedInHooks));
            return updatedArtifact;

          default:
            return draftArtifact;
        }
      });
    });
  }, [dataStream, setArtifact, setMetadata, artifact]);

  return null;
}
