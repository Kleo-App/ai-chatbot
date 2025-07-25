"use client";

import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";

interface LiveTranscriptionProps {
  onTranscriptionUpdate?: (text: string) => void;
  onTranscriptionComplete?: (text: string) => void;
  className?: string;
  showText?: boolean;
}

interface TranscriptionResources {
  connection: any; // Using any to avoid TypeScript issues with Deepgram SDK types
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
  
  const startTranscription = async () => {
    try {
      setError(null);
      // Don't clear transcript here as we already do it in handleToggleTranscription
      setIsProcessing(true);
      // Reset accumulated transcript when starting a new recording
      accumulatedTranscriptRef.current = "";
      interimResultRef.current = "";
      
      // Get Deepgram API key from environment variable
      const deepgramApiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
      if (!deepgramApiKey) {
        setError("Deepgram API key is not configured. Please add NEXT_PUBLIC_DEEPGRAM_API_KEY to your .env.local file.");
        setIsProcessing(false);
        return;
      }

      // Create Deepgram client with API key
      const deepgram = createClient(deepgramApiKey);
      const connection = deepgram.listen.live({
        model: "nova-2",
        language: "en-US",
        smart_format: true,
        interim_results: true,
        utterance_detection: true,
        endpointing: 1000, // Use milliseconds for endpointing (1 second pause detection)
        vad_events: true,
        punctuate: true,
        numerals: true,
      });

      // Set up connection event handlers
      connection.on(LiveTranscriptionEvents.Open, async () => {
        console.log("Deepgram connection opened.");
        
        try {
          // Request microphone access
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          // Create media recorder
          const mediaRecorder = new MediaRecorder(audioStream, { mimeType: "audio/webm" });
          
          // Store resources for later cleanup
          resourcesRef.current = {
            connection,
            mediaRecorder,
            audioStream
          };
          
          // Set up data handler
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0 && connection.getReadyState() === 1) {
              connection.send(event.data);
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
          connection.finish();
        }
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
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

      connection.on(LiveTranscriptionEvents.Close, () => {
        console.log("Deepgram connection closed.");
        setIsListening(false);
        setIsProcessing(false);
        
        // Call the complete callback with the final transcript
        if (transcript && onTranscriptionComplete) {
          onTranscriptionComplete(transcript.trim());
        }
      });

      connection.on(LiveTranscriptionEvents.Error, (err) => {
        console.error("Deepgram transcription error:", err);
        setError("Transcription error occurred.");
        setIsListening(false);
        setIsProcessing(false);
      });
    } catch (err) {
      console.error("Error starting transcription:", err);
      setError("Could not initialize transcription service.");
      setIsProcessing(false);
    }
  };

  const stopTranscription = () => {
    if (!resourcesRef.current) return;
    
    const { connection, mediaRecorder, audioStream } = resourcesRef.current;
    
    // Stop recording
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    
    // Stop all tracks
    audioStream.getTracks().forEach((track) => track.stop());
    
    // Close the connection
    connection.finish();
    
    // Clear resources
    resourcesRef.current = null;
    
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
