import { NextRequest, NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

// This route will handle WebSocket connections for Deepgram transcription
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Singleton pattern for the Socket.IO server
let io: SocketIOServer | null = null;
let httpServer: any = null;
let isServerInitializing = false;
let isServerInitialized = false;

// Track active Deepgram connections
const activeConnections = new Map();

// Initialize the Socket.IO server
function getSocketIOServer() {
  // If server is already initialized or currently initializing, return the existing instance
  if (isServerInitialized) {
    return io;
  }
  
  if (isServerInitializing) {
    console.log('WebSocket server is already initializing, waiting...');
    return io;
  }
  
  if (!io) {
    isServerInitializing = true;
    console.log('Initializing Socket.IO server...');
    
    // Create HTTP server for Socket.IO
    httpServer = createServer();
    
    // Create Socket.IO server
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      path: '/socket.io',
    });
    
    // Set up Socket.IO event handlers
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      let deepgramConnection: any = null;
      
      // Handle client connection
      socket.on('start', async () => {
        try {
          // Get the API key from environment variables
          const apiKey = process.env.DEEPGRAM_API_KEY;
          
          if (!apiKey) {
            socket.emit('error', { message: 'Deepgram API key is not configured' });
            return;
          }
          
          // Create Deepgram client with API key
          const deepgram = createClient(apiKey);
          
          // Create Deepgram live transcription connection
          deepgramConnection = deepgram.listen.live({
            model: 'nova-2',
            language: 'en-US',
            smart_format: true,
            interim_results: true,
            utterance_detection: true,
            endpointing: 1000,
            vad_events: true,
            punctuate: true,
            numerals: true,
          });
          
          // Store the connection
          activeConnections.set(socket.id, deepgramConnection);
          
          // Forward Deepgram events to the client
          deepgramConnection.on(LiveTranscriptionEvents.Open, () => {
            socket.emit('deepgram:open', {
              message: 'Deepgram connection established'
            });
          });
          
          deepgramConnection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
            socket.emit('deepgram:transcript', data);
          });
          
          deepgramConnection.on(LiveTranscriptionEvents.Error, (error: any) => {
            socket.emit('deepgram:error', {
              message: 'Deepgram error',
              error: error
            });
          });
          
          deepgramConnection.on(LiveTranscriptionEvents.Close, () => {
            socket.emit('deepgram:close', {
              message: 'Deepgram connection closed'
            });
            
            // Clean up the connection
            activeConnections.delete(socket.id);
            deepgramConnection = null;
          });
        } catch (error) {
          console.error('Error starting Deepgram:', error);
          socket.emit('error', { message: 'Failed to start transcription' });
        }
      });
      
      // Handle audio data from client
      socket.on('audio', (data) => {
        const connection = activeConnections.get(socket.id);
        if (connection && connection.getReadyState() === 1) {
          connection.send(data);
        }
      });
      
      // Handle stop request
      socket.on('stop', () => {
        const connection = activeConnections.get(socket.id);
        if (connection) {
          connection.finish();
          activeConnections.delete(socket.id);
        }
      });
      
      // Handle client disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        const connection = activeConnections.get(socket.id);
        if (connection) {
          connection.finish();
          activeConnections.delete(socket.id);
        }
      });
    });
    
    // Start the HTTP server on a dynamic port
    const PORT = parseInt(process.env.WEBSOCKET_PORT || '3001', 10);
    
    // Set up error handling for the server
    httpServer.on('error', (error: any) => {
      isServerInitializing = false;
      
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} already in use, assuming server is already running`);
        // Mark as initialized anyway since there's likely another instance running
        isServerInitialized = true;
      } else {
        console.error('Error starting WebSocket server:', error);
      }
    });
    
    // Start listening on the port
    httpServer.listen(PORT, () => {
      console.log(`WebSocket server listening on port ${PORT}`);
      isServerInitializing = false;
      isServerInitialized = true;
    });
  }
  
  return io;
}

// This route handler will provide connection information to the client
export async function GET(request: NextRequest) {
  try {
    // Initialize the Socket.IO server if it hasn't been initialized yet
    getSocketIOServer();
    
    // If the server is still initializing, wait a bit
    if (isServerInitializing && !isServerInitialized) {
      console.log('Waiting for WebSocket server to initialize...');
      // Simple wait to give the server a chance to initialize or error out
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Determine the WebSocket URL
    const host = request.headers.get('host') || 'localhost';
    const protocol = request.headers.get('x-forwarded-proto') === 'https' ? 'wss' : 'ws';
    const port = process.env.WEBSOCKET_PORT || '3001';
    const path = '/socket.io';
    
    // For local development, include the port
    const socketUrl = host.includes('localhost') 
      ? `${protocol}://localhost:${port}${path}` 
      : `${protocol}://${host}${path}`;
    
    return NextResponse.json({
      socketUrl,
      message: 'Connect to this WebSocket server for real-time transcription',
      status: isServerInitialized ? 'ready' : 'initializing'
    });
  } catch (error) {
    console.error('Error in socket route:', error);
    return NextResponse.json(
      { error: 'Failed to initialize WebSocket server' },
      { status: 500 }
    );
  }
}
