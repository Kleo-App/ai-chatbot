"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { io, Socket } from "socket.io-client";

interface LiveTranscriptionProps {
  onTranscriptionUpdate?: (text: string) => void;
  onTranscriptionComplete?: (text: string) => void;
  className?: string;
  showText?: boolean;
}

interface TranscriptionResources {
  socket: Socket;
  mediaRecorder: MediaRecorder;
  audioStream: MediaStream;
}

export function LiveTranscription({
  onTranscriptionUpdate,
  onTranscriptionComplete,
  className,
  showText = false
}: LiveTranscriptionProps) {
  const [transcript, setTranscript] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to store resources that need to persist between renders
  const resourcesRef = useRef<TranscriptionResources | null>(null);
  
  // Use useEffect to handle transcript updates to avoid React state update issues
  useEffect(() => {
    if (transcript.trim() && onTranscriptionUpdate) {
      onTranscriptionUpdate(transcript.trim());
    }
  }, [transcript, onTranscriptionUpdate]);

  // Track utterances for accumulating transcripts across pauses
  const accumulatedTranscriptRef = useRef<string>("");
  // Track interim results separately to reduce UI flickering
  const interimResultRef = useRef<string>("");
  // Use a debounce timer to smooth updates
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Socket.io instance reference
  const socketRef = useRef<Socket | null>(null);
  
  const startTranscription = async () => {
    try {
      setError(null);
      // Don't clear transcript here as we already do it in handleToggleTranscription
      setIsProcessing(true);
      // Reset accumulated transcript when starting a new recording
      accumulatedTranscriptRef.current = "";
      interimResultRef.current = "";
      
      // Get WebSocket server information from our backend
      const response = await fetch('/api/transcribe/socket');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to get WebSocket info: ${response.status}`;
        console.error('WebSocket info error:', errorMessage);
        setError(errorMessage);
        setIsProcessing(false);
        return;
      }
      
      // Get socket URL from response
      const data = await response.json();
      const socketUrl = data.socketUrl;
      
      if (!socketUrl) {
        const errorMessage = 'No WebSocket URL received from server';
        console.error(errorMessage);
        setError(errorMessage);
        setIsProcessing(false);
        return;
      }
      
      // Check server status
      if (data.status === 'initializing') {
        console.log('WebSocket server is initializing, waiting...');
        // Wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 1000));
        return startTranscription();
      }
      
      // Parse the URL to get the base URL and path
      const url = new URL(socketUrl);
      const baseUrl = `${url.protocol}//${url.host}`;
      
      // Create Socket.IO connection
      const socket = io(baseUrl, {
        path: url.pathname,
        transports: ['websocket']
      });
      socketRef.current = socket;
      
      // Set up socket event handlers
      socket.on('connect', async () => {
        console.log('Connected to WebSocket server');
        
        // Signal server to start Deepgram connection
        socket.emit('start');
        
        try {
          // Request microphone access
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          // Create media recorder
          const mediaRecorder = new MediaRecorder(audioStream, { mimeType: "audio/webm" });
          
          // Store resources for later cleanup
          resourcesRef.current = {
            socket,
            mediaRecorder,
            audioStream
          };
          
          // Set up data handler to send audio to server
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0 && socket.connected) {
              // Convert Blob to ArrayBuffer and send to server
              event.data.arrayBuffer().then(buffer => {
                socket.emit('audio', buffer);
              });
            }
          };
          
          // Start recording
          mediaRecorder.start(500); // Send audio chunks every 500ms for smoother experience
          
          setIsListening(true);
          setIsProcessing(false);
        } catch (err) {
          console.error("Error accessing microphone:", err);
          setError("Could not access microphone. Please check permissions.");
          setIsProcessing(false);
          socket.disconnect();
        }
      });
      
      // Handle Deepgram events forwarded by the server
      socket.on('deepgram:open', () => {
        console.log("Deepgram connection opened.");
      });
      
      socket.on('deepgram:transcript', (data) => {
        const receivedTranscript = data.channel?.alternatives?.[0]?.transcript || "";
        const isFinal = data.is_final || false;
        const isUtteranceEnd = data.speech_final || false;
        
        if (receivedTranscript) {
          // Clear any pending update timer
          if (updateTimerRef.current) {
            clearTimeout(updateTimerRef.current);
            updateTimerRef.current = null;
          }
          
          // If this is the end of an utterance (pause in speech), accumulate it
          if (isUtteranceEnd || isFinal) {
            // This is a final result, add it to our accumulated transcript
            accumulatedTranscriptRef.current = (accumulatedTranscriptRef.current + " " + receivedTranscript).trim();
            interimResultRef.current = ""; // Clear interim results
            
            // Update the UI with the final transcript
            setTranscript(accumulatedTranscriptRef.current);
          } else {
            // This is an interim result, store it separately
            interimResultRef.current = receivedTranscript;
            
            // Debounce the UI update to reduce flickering
            updateTimerRef.current = setTimeout(() => {
              // For ongoing speech, show accumulated text plus current interim result
              const fullTranscript = (accumulatedTranscriptRef.current + " " + interimResultRef.current).trim();
              setTranscript(fullTranscript);
            }, 150); // Slightly longer delay to smooth updates
          }
        }
      });
      
      socket.on('deepgram:close', () => {
        console.log("Deepgram connection closed.");
        setIsListening(false);
        setIsProcessing(false);
        
        // Call the complete callback with the final transcript
        if (transcript && onTranscriptionComplete) {
          onTranscriptionComplete(transcript.trim());
        }
      });
      
      socket.on('deepgram:error', (err) => {
        console.error("Deepgram transcription error:", err);
        setError("Transcription error occurred.");
        setIsListening(false);
        setIsProcessing(false);
      });
      
      socket.on('error', (err) => {
        console.error("Socket error:", err);
        setError("Connection error occurred.");
        setIsListening(false);
        setIsProcessing(false);
      });
      
      socket.on('disconnect', () => {
        console.log("Disconnected from WebSocket server");
        setIsListening(false);
        setIsProcessing(false);
        
        // Call the complete callback with the final transcript
        if (transcript && onTranscriptionComplete) {
          onTranscriptionComplete(transcript.trim());
        }
      });
      
    } catch (err) {
      console.error("Error starting transcription:", err);
      setError("Could not initialize transcription service.");
      setIsProcessing(false);
    }
  };

  const stopTranscription = () => {
    if (!resourcesRef.current) return;
    
    const { socket, mediaRecorder, audioStream } = resourcesRef.current;
    
    // Stop recording
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    
    // Stop all tracks
    audioStream.getTracks().forEach((track) => track.stop());
    
    // Tell server to stop transcription
    socket.emit('stop');
    
    // Disconnect from server
    socket.disconnect();
    
    // Clear resources
    resourcesRef.current = null;
    socketRef.current = null;
    
    // Clear any pending update timer
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
      updateTimerRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resourcesRef.current) {
        stopTranscription();
      } else if (socketRef.current) {
        // In case the socket exists but isn't in resourcesRef
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // Additional cleanup for any pending timers
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
        updateTimerRef.current = null;
      }
    };
  }, []);

  const handleToggleTranscription = async () => {
    if (isListening) {
      setIsProcessing(true);
      stopTranscription();
    } else {
      // Clear transcript state before starting new transcription
      // but don't clear the parent component's text
      setTranscript("");
      // Make sure to reset the accumulated transcript in the connection handler too
      await startTranscription();
    }
  };

  return (
    <div className={className}>
      {error && (
        <div className="text-red-500 text-sm mb-2">{error}</div>
      )}
      
      <Button
        type="button"
        variant={isListening ? "destructive" : "ghost"}
        size="sm"
        className={`${showText ? 'px-3 py-2 h-auto' : 'size-8 p-0'} ${isListening ? 'bg-red-500 hover:bg-red-600' : 'text-[#157DFF] hover:text-blue-600 hover:bg-blue-50'}`}
        onClick={handleToggleTranscription}
        disabled={isProcessing}
      >
        {showText ? (
          <div className="flex items-center gap-2">
            {isProcessing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isListening ? (
              <Square className="size-4" />
            ) : (
              <Mic className="size-4" />
            )}
            <span className="text-sm">
              {isProcessing ? 'Processing...' : isListening ? 'Stop' : 'Record'}
            </span>
          </div>
        ) : (
          <>
            {isProcessing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isListening ? (
              <Square className="size-4" />
            ) : (
              <Mic className="size-4" />
            )}
          </>
        )}
      </Button>
      
      {/* Transcript is now displayed in the parent component's textbox */}
    </div>
  );
}
