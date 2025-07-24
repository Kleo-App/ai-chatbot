/**
 * Mem0 integration with Vercel AI SDK
 * Provides memory capabilities with fallback if API key is not available
 */

import { createMem0, addMemories } from '@mem0/vercel-ai-provider';

/**
 * Types for Mem0 integration
 */
// Message types that match what Mem0 expects
type MessageRole = 'user' | 'assistant' | 'system';
interface SimpleMessage { 
  role: MessageRole; 
  content: string;
  name?: string;
}

// Memory response type from Mem0 API
interface MemoryResponse {
  id: string;
  text?: string;
  memory?: string;
  metadata?: Record<string, any>;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

// Define our own interface for memory options since it's not exported from the package
interface MemoryOptions {
  user_id: string;
  metadata?: Record<string, any>;
  mem0ApiKey?: string;
  org_id?: string;
  project_id?: string;
  // Add any other options that might be used
  compatibility?: 'strict' | 'loose';
}

/**
 * Custom error class for Mem0-related errors
 */
export class Mem0Error extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'Mem0Error';
    
    // Capture stack trace for better debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, Mem0Error);
    }
  }
}

/**
 * Create and configure the Mem0 client for use with Vercel AI SDK
 * Falls back gracefully if API keys are not available
 * 
 * @param options - Configuration options for the Mem0 client
 * @param options.userId - Optional user ID to associate with memories
 * @param options.orgId - Optional organization ID for enterprise use
 * @param options.projectId - Optional project ID for organizing memories
 * @returns Configured Mem0 client or null if initialization fails
 */
export function createMem0Client(options?: {
  userId?: string;
  orgId?: string;
  projectId?: string;
}): ReturnType<typeof createMem0> | null {
  try {
    // Get API keys from environment variables
    const mem0ApiKey = process.env.MEM0_API_KEY;
    const providerApiKey = process.env.OPENAI_API_KEY;
    
    // Validate required API keys
    if (!mem0ApiKey) {
      console.warn('MEM0_API_KEY not found in environment variables. Memory features will be disabled.');
      return null;
    }
    
    if (!providerApiKey) {
      console.warn('OPENAI_API_KEY not found in environment variables. Memory features will be disabled.');
      return null;
    }
    
    // Create and return the Mem0 client
    return createMem0({
      provider: 'openai',
      mem0ApiKey,
      apiKey: providerApiKey,
      config: {
        compatibility: 'strict',
      },
      // Optional Mem0 Global Config
      mem0Config: {
        user_id: options?.userId,
        org_id: options?.orgId,
        project_id: options?.projectId,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to initialize Mem0 client: ${errorMessage}`);
    return null;
  }
}

/**
 * Memory search result with similarity score
 */
interface MemorySearchResult extends MemoryResponse {
  score?: number;
}

/**
 * Search parameters for Mem0 client
 */
interface MemorySearchParams {
  query: string;
  userId?: string;
  filters?: {
    category?: string;
    [key: string]: any;
  };
  limit?: number;
}

/**
 * Extended Mem0 client interface with methods that exist in the actual client
 * but aren't included in the TypeScript type definition
 */
interface Mem0Client {
  // Base methods from the Mem0 provider
  (model: string, options?: { user_id?: string; [key: string]: any }): any;
  
  // Extended methods that exist in the actual client
  get: (memoryId: string) => Promise<MemoryResponse>;
  update: (params: { memoryId: string; text: string; metadata?: Record<string, any> }) => Promise<void>;
  delete: (memoryId: string) => Promise<void>;
  search: (params: MemorySearchParams) => Promise<MemorySearchResult[]>;
  // Add any other methods that might be used
  clear?: () => Promise<void>;
}

// Client instance cache for server-side usage
// Using WeakMap would be better for garbage collection, but keys need to be objects
// Using a regular Map with a cleanup mechanism
const mem0InstanceMap = new Map<string, { client: Mem0Client; lastAccessed: number }>();

// Maximum age of cached clients in milliseconds (30 minutes)
const MAX_CLIENT_AGE = 30 * 60 * 1000;

/**
 * Clean up old client instances to prevent memory leaks
 */
function cleanupStaleClients(): void {
  const now = Date.now();
  for (const [key, value] of mem0InstanceMap.entries()) {
    if (now - value.lastAccessed > MAX_CLIENT_AGE) {
      mem0InstanceMap.delete(key);
    }
  }
}

// Run cleanup every 10 minutes if this is running in a long-lived server context
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupStaleClients, 10 * 60 * 1000);
}

/**
 * Generate a cache key for the Mem0 client based on options
 * 
 * @param options - Configuration options with user, org, and project IDs
 * @returns A unique string key for the cache
 */
function getClientCacheKey(options?: { userId?: string; orgId?: string; projectId?: string }): string {
  return `${options?.userId || ''}-${options?.orgId || ''}-${options?.projectId || ''}`;
}

/**
 * Get the Mem0 client instance, initializing it if necessary
 * For server-side usage where a singleton is appropriate
 * 
 * @param options - Configuration options for the Mem0 client
 * @param options.userId - Optional user ID to associate with memories
 * @param options.orgId - Optional organization ID for enterprise use
 * @param options.projectId - Optional project ID for organizing memories
 * @returns Configured Mem0 client or null if initialization fails
 */
export function getMem0Client(options?: {
  userId?: string;
  orgId?: string;
  projectId?: string;
}): Mem0Client | null {
  const cacheKey = getClientCacheKey(options);
  const now = Date.now();
  
  // Check if we have a cached client and update its last accessed time
  if (mem0InstanceMap.has(cacheKey)) {
    const cachedEntry = mem0InstanceMap.get(cacheKey)!;
    cachedEntry.lastAccessed = now;
    return cachedEntry.client;
  }
  
  // Create a new client if needed
  const client = createMem0Client(options);
  if (client) {
    // Store the client with its creation timestamp
    mem0InstanceMap.set(cacheKey, {
      client: client as unknown as Mem0Client,
      lastAccessed: now
    });
    
    // Run a cleanup to remove any stale clients
    cleanupStaleClients();
    
    return client as unknown as Mem0Client;
  }
  
  return null;
}

/**
 * Safely execute a memory operation with fallback
 * 
 * @param operation - Function that uses the memory client
 * @param fallback - Function to execute if memory client fails or is unavailable
 * @param options - Configuration options for the Mem0 client
 * @returns Promise resolving to the result of either operation or fallback
 */
export async function withMem0<T>(
  operation: (client: Mem0Client) => Promise<T>,
  fallback: () => Promise<T>,
  options?: { userId?: string; orgId?: string; projectId?: string }
): Promise<T> {
  const client = getMem0Client(options);
  
  if (!client) {
    console.info('Mem0 client not available, using fallback');
    return fallback();
  }
  
  try {
    return await operation(client);
  } catch (error) {
    console.error('Memory operation failed:', error instanceof Error ? error.message : String(error));
    return fallback();
  }
}

/**
 * Prepare standard metadata for Mem0 operations
 * 
 * @param category - Category to classify the memory
 * @param customMetadata - Additional metadata to include
 * @returns Standardized metadata object
 */
function prepareMetadata(category: string, customMetadata?: Record<string, any>): Record<string, any> {
  return {
    category,
    ...(customMetadata || {}),
    source: 'ai-chatbot',
    timestamp: new Date().toISOString()
  };
}

/**
 * Add a new memory to Mem0
 * 
 * @param userId - The user ID from Clerk
 * @param content - The content to store as a memory
 * @param category - Category to classify the memory
 * @param metadata - Optional additional metadata
 * @returns Promise with the new memory ID or success message
 */
export async function addMemory(
  userId: string,
  content: string,
  category: string,
  metadata?: Record<string, any>
): Promise<string> {
  // Validate required parameters
  if (!userId) {
    throw new Mem0Error('User ID is required');
  }

  if (!content) {
    throw new Mem0Error('Content is required');
  }
  
  if (!category) {
    throw new Mem0Error('Category is required');
  }
  
  try {
    // Create a simple message array with the content
    const messages: SimpleMessage[] = [
      { 
        role: 'user', 
        content 
      }
    ];
    
    // Prepare memory options with standardized metadata
    const options: MemoryOptions = { 
      user_id: userId,
      metadata: prepareMetadata(category, metadata)
    };
    
    // Add the memory with metadata
    // Type assertion is still necessary because the library's TypeScript definitions
    // don't match the actual expected format
    const response = await addMemories(messages as any, options);
    
    // Return the new memory ID if available, otherwise a success message
    if (Array.isArray(response) && response.length > 0 && response[0]?.id) {
      return response[0].id;
    } 
    
    return 'Memory added successfully';
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to add memory to Mem0: ${errorMessage}`);
    throw new Mem0Error('Failed to add memory', error);
  }
}

/**
 * Update an existing memory in Mem0
 * 
 * @param memoryId - The ID of the memory to update
 * @param newContent - The new content for the memory
 * @param newMetadata - Optional new metadata to merge with existing metadata
 * @returns Promise that resolves when the update is complete
 * @throws Mem0Error if the operation fails
 */
export async function updateMemory(
  memoryId: string,
  newContent: string,
  newMetadata?: Record<string, any>
): Promise<void> {
  // Validate required parameters
  if (!memoryId) {
    throw new Mem0Error('Memory ID is required for updating a memory');
  }

  if (!newContent) {
    throw new Mem0Error('New content is required for updating a memory');
  }

  try {
    // Get the Mem0 client
    const client = getMem0Client();
    
    if (!client) {
      throw new Mem0Error('Mem0 client is not available');
    }

    let mergedMetadata = newMetadata;

    // If metadata is provided, we need to merge it with existing metadata
    if (newMetadata) {
      try {
        // Get the existing memory to access its metadata
        const existingMemory = await client.get(memoryId);
        
        if (existingMemory?.metadata) {
          // Use our helper function to prepare the metadata
          // Include the existing metadata as a base and merge with new metadata
          const category = existingMemory.metadata.category || 'updated';
          mergedMetadata = prepareMetadata(category, {
            ...existingMemory.metadata,
            ...newMetadata,
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`Could not fetch existing memory metadata for ID ${memoryId}: ${errorMessage}`);
        
        // Continue with just the new metadata if we can't get the existing metadata
        mergedMetadata = {
          ...newMetadata,
          updated_at: new Date().toISOString()
        };
      }
    }

    // Update the memory with new content and merged metadata
    await client.update({
      memoryId,
      text: newContent,
      metadata: mergedMetadata
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to update memory ${memoryId}: ${errorMessage}`);
    throw new Mem0Error(`Failed to update memory ${memoryId}`, error);
  }
}

/**
 * Intelligently merge existing content with new content based on category
 * 
 * @param category - Category of the memory
 * @param existing - Existing content
 * @param newContent - New content to merge
 * @returns Merged content
 */
function mergeContent(category: string, existing: string, newContent: string): string {
  // For preferences or settings, replace the content
  if (category.includes('preference') || category.includes('setting') || category.includes('automation')) {
    return newContent;
  }
  
  // For history or logs, append with timestamp
  if (category.includes('history') || category.includes('log')) {
    const timestamp = new Date().toISOString();
    return `${existing}\n\n[${timestamp}]\n${newContent}`;
  }
  
  // For other categories, append if different
  if (existing !== newContent) {
    return `${existing}\n\n${newContent}`;
  }
  
  // If content is the same, just return it
  return existing;
}

/**
 * Merge existing metadata with new metadata
 * 
 * @param existing - Existing metadata
 * @param newMetadata - New metadata to merge
 * @returns Merged metadata
 */
function mergeMetadata(
  existing: Record<string, any> | undefined, 
  newMetadata: Record<string, any> | undefined
): Record<string, any> {
  // Create a new object with existing metadata
  const merged = { ...(existing || {}) };
  
  // Merge with new metadata (new values override existing ones)
  if (newMetadata) {
    Object.assign(merged, newMetadata);
  }
  
  // Always update the timestamp
  merged.updated_at = new Date().toISOString();
  
  return merged;
}

/**
 * Add or update a memory based on content similarity and category
 * 
 * @param userId - The user ID from Clerk
 * @param category - Category to classify the memory
 * @param content - The content to store as a memory
 * @param metadata - Optional additional metadata
 * @param similarityThreshold - Threshold for considering memories similar (0.0-1.0)
 * @returns Promise with the memory ID
 */
export async function addOrUpdateMemory(
  userId: string,
  category: string,
  content: string,
  metadata?: Record<string, any>,
  similarityThreshold: number = 0.8
): Promise<string> {
  // Validate required parameters
  if (!userId) {
    throw new Mem0Error('User ID is required');
  }

  if (!content) {
    throw new Mem0Error('Content is required');
  }
  
  if (!category) {
    throw new Mem0Error('Category is required');
  }
  
  // Validate similarity threshold
  if (similarityThreshold < 0 || similarityThreshold > 1) {
    throw new Mem0Error('Similarity threshold must be between 0 and 1');
  }
  
  // Get the Mem0 client
  const client = getMem0Client({ userId });
  
  if (!client) {
    throw new Mem0Error('Mem0 client is not available');
  }
  
  try {
    // Categories that should always create new memories instead of updating
    const alwaysAddCategories = ['feedback_history', 'session_logs', 'chat_history'];
    
    // For certain categories, always add a new memory
    if (alwaysAddCategories.some(c => category.includes(c))) {
      return await addMemory(userId, content, category, metadata);
    }
    
    // For other categories, search for similar memories first
    const searchResults = await client.search({
      query: content,
      userId,
      filters: { category },
      limit: 1
    });
    
    // If we found a similar memory above the threshold, update it
    if (
      Array.isArray(searchResults) && 
      searchResults.length > 0 && 
      searchResults[0].score !== undefined && 
      searchResults[0].score > similarityThreshold
    ) {
      const memoryId = searchResults[0].id;
      const existingText = searchResults[0].text || searchResults[0].memory || '';
      const existingMetadata = searchResults[0].metadata;
      
      // Merge content and metadata
      const mergedContent = mergeContent(category, existingText, content);
      const mergedMetadata = mergeMetadata(existingMetadata, metadata);
      
      // Update the existing memory
      await updateMemory(memoryId, mergedContent, mergedMetadata);
      return memoryId;
    }
    
    // Otherwise, add a new memory
    return await addMemory(userId, content, category, metadata);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to add or update memory: ${errorMessage}`);
    throw new Mem0Error('Failed to add or update memory', error);
  }
}

export default createMem0Client;
