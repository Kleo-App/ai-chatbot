"use client";

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  className?: string;
  showText?: boolean;
}

export function VoiceRecorder({ onTranscriptionComplete, className, showText = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Start recording
  const startRecording = async () => {
    try {
      setError(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Clear previous audio chunks
      audioChunksRef.current = [];
      
      // Add data handler
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };
  
  // Stop recording and process audio
  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    
    setIsRecording(false);
    setIsProcessing(true);
    
    // Stop the media recorder
    mediaRecorderRef.current.stop();
    
    // Process when stopped
    mediaRecorderRef.current.onstop = async () => {
      try {
        // Create audio blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Send to server for transcription
        await sendToDeepgram(audioBlob);
        
        // Stop all tracks in the stream
        if (mediaRecorderRef.current?.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        console.error('Error processing recording:', err);
        setError('Failed to process recording.');
        setIsProcessing(false);
      }
    };
  };
  
  // Send audio to Deepgram via server
  const sendToDeepgram = async (audioBlob: Blob) => {
    try {
      // Create form data to send the audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      // Send to our API route
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.transcription) {
        // Call the callback with the transcribed text
        onTranscriptionComplete(data.transcription);
      } else {
        setError('No transcription returned.');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setError('Failed to transcribe audio.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  return (
    <div className={className}>
      {error && (
        <div className="text-red-500 text-sm mb-2">{error}</div>
      )}
      
      <Button
        type="button"
        variant={isRecording ? "destructive" : "ghost"}
        size="sm"
        className={`${showText ? 'px-3 py-2 h-auto' : 'size-8 p-0'} ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'text-[#157DFF] hover:text-blue-600 hover:bg-blue-50'}`}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
      >
        {showText ? (
          <div className="flex items-center gap-2">
            {isProcessing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isRecording ? (
              <Square className="size-4" />
            ) : (
              <Mic className="size-4" />
            )}
            <span className="text-sm">
              {isProcessing ? 'Processing...' : isRecording ? 'Stop' : 'Record'}
            </span>
          </div>
        ) : (
          <>
            {isProcessing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isRecording ? (
              <Square className="size-4" />
            ) : (
              <Mic className="size-4" />
            )}
          </>
        )}
      </Button>
    </div>
  );
}
