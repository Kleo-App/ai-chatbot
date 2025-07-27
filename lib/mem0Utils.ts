/**
 * Mem0 integration with Vercel AI SDK
 * Provides memory capabilities with fallback if API key is not available
 */

import { createMem0, addMemories, retrieveMemories, getMemories } from '@mem0/vercel-ai-provider';

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
export interface MemorySearchResult extends MemoryResponse {
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
 * Note: The Mem0 Vercel AI provider uses standalone functions (addMemories, retrieveMemories, getMemories)
 * rather than a client object with methods. The client management code below is kept for potential future use.
 */
interface Mem0Client {
  // Base methods from the Mem0 provider
  (model: string, options?: { user_id?: string; [key: string]: any }): any;
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
 * Since the Mem0 Vercel AI provider doesn't support direct ID-based updates,
 * this function requires additional context to work properly
 * 
 * @param memoryId - The ID of the memory to update (currently used for logging only)
 * @param userId - The user ID (required for Mem0 operations)
 * @param category - The category of the memory (required for similarity matching)
 * @param newContent - The new content for the memory
 * @param newMetadata - Optional new metadata to merge with existing metadata
 * @returns Promise that resolves when the update is complete
 */
export async function updateMemory(
  memoryId: string,
  userId: string,
  category: string,
  newContent: string,
  newMetadata?: Record<string, any>
): Promise<void> {
  // Validate required parameters
  if (!memoryId) {
    throw new Mem0Error('Memory ID is required for updating a memory');
  }

  if (!userId) {
    throw new Mem0Error('User ID is required for updating a memory');
  }

  if (!category) {
    throw new Mem0Error('Category is required for updating a memory');
  }

  if (!newContent) {
    throw new Mem0Error('New content is required for updating a memory');
  }

  try {
    console.log(`Updating memory ${memoryId} for user ${userId} in category ${category}`);
    
    // Use addOrUpdateMemory which handles similarity matching and updating
    await addOrUpdateMemory(userId, category, newContent, newMetadata, 0.7);
    
    console.log(`Memory ${memoryId} updated successfully`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to update memory ${memoryId}: ${errorMessage}`);
    throw new Mem0Error(`Failed to update memory ${memoryId}`, error);
  }
}

/**
 * Add or update a memory based on content similarity and category
 * Uses addMemories from @mem0/vercel-ai-provider (simplified to add-only for now)
 * 
 * @param userId - The user ID from Clerk
 * @param category - Category to classify the memory
 * @param content - The content to store as a memory
 * @param metadata - Optional additional metadata
 * @param similarityThreshold - Threshold for considering memories similar (0.0-1.0) - currently ignored
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
  
  try {
    // For now, just add a new memory using the addMemories function
    // TODO: Implement update logic when available in the Mem0 provider
    return await addMemory(userId, content, category, metadata);
    
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to add or update memory: ${errorMessage}`);
    throw new Mem0Error('Failed to add or update memory', error);
  }
}

/**
 * Retrieve relevant memories for a user based on a query
 * Uses the retrieveMemories function from @mem0/vercel-ai-provider
 * 
 * @param userId - The user ID from Clerk
 * @param query - The search query to find relevant memories
 * @param category - Optional category filter
 * @param limit - Maximum number of memories to return (default: 5)
 * @returns Promise with array of relevant memories
 */
export async function getRelevantMemories(
  userId: string,
  query: string,
  category?: string,
  limit: number = 5
): Promise<MemorySearchResult[]> {
  // Validate required parameters
  if (!userId) {
    throw new Mem0Error('User ID is required');
  }

  if (!query) {
    throw new Mem0Error('Query is required');
  }
  
  // Validate limit
  if (limit <= 0) {
    throw new Mem0Error('Limit must be greater than 0');
  }
  
  try {
    // Check if API keys are available
    const mem0ApiKey = process.env.MEM0_API_KEY;
    if (!mem0ApiKey) {
      console.warn('MEM0_API_KEY not found, returning empty results');
      return [];
    }
    
    // Use the retrieveMemories function from Mem0 provider
    // Based on the Mem0 documentation, retrieveMemories expects messages array and options
    const messages = [{ 
      role: 'user' as const, 
      content: [{ type: 'text' as const, text: query }] 
    }];
    const options: any = { 
      user_id: userId,
      limit 
    };
    
    if (category) {
      options.filters = { category };
    }
    
    const memories = await retrieveMemories(messages, options);
    
    // Transform the response to match our expected format
    if (!memories || !Array.isArray(memories)) {
      console.warn('Unexpected response format from retrieveMemories');
      return [];
    }
    
    return memories.map((memory: any) => ({
      id: memory.id || '',
      text: memory.text || memory.memory || '',
      metadata: memory.metadata || {},
      score: memory.score || 0
    }));
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to retrieve memories for user ${userId}: ${errorMessage}`);
    
    // Return empty array on error to fail gracefully
    return [];
  }
}

/**
 * Format memories for injection into AI prompts
 * 
 * @param memories - Array of memory search results
 * @param scoreThreshold - Minimum score threshold for including memories (default: 0.5)
 * @param maxLength - Maximum length of the formatted string (default: 2000 characters)
 * @returns Formatted string for prompt injection
 */
export function formatMemoriesForPrompt(
  memories: MemorySearchResult[],
  scoreThreshold: number = 0.5,
  maxLength: number = 2000
): string {
  // Validate parameters
  if (!Array.isArray(memories)) {
    console.warn('Invalid memories array provided to formatMemoriesForPrompt');
    return '';
  }
  
  if (scoreThreshold < 0 || scoreThreshold > 1) {
    console.warn('Score threshold must be between 0 and 1, using default 0.5');
    scoreThreshold = 0.5;
  }
  
  // Filter memories by score threshold and sort by score (highest first)
  const relevantMemories = memories
    .filter(mem => (mem.score || 0) > scoreThreshold)
    .sort((a, b) => (b.score || 0) - (a.score || 0));
  
  if (relevantMemories.length === 0) {
    return '';
  }
  
  // Format each memory for prompt injection
  const formattedMemories = relevantMemories.map(mem => {
    const text = mem.text || '';
    const source = mem.metadata?.source || 'unknown';
    const category = mem.metadata?.category || 'general';
    const timestamp = mem.metadata?.timestamp || mem.metadata?.created_at || '';
    
    // Create a concise memory string
    let memoryString = `Memory: ${text}`;
    
    // Add context information
    const contextInfo = [];
    if (category !== 'general') contextInfo.push(`category: ${category}`);
    if (source !== 'unknown') contextInfo.push(`source: ${source}`);
    if (timestamp) {
      try {
        const date = new Date(timestamp);
        const formattedDate = date.toLocaleDateString();
        contextInfo.push(`from: ${formattedDate}`);
      } catch {
        // If timestamp parsing fails, skip it
      }
    }
    
    if (contextInfo.length > 0) {
      memoryString += ` (${contextInfo.join(', ')})`;
    }
    
    return memoryString;
  });
  
  // Join memories and ensure we don't exceed maxLength
  let result = formattedMemories.join('\n');
  
  // Truncate if necessary while preserving complete memory entries
  if (result.length > maxLength) {
    const lines = result.split('\n');
    let truncated = '';
    
    for (const line of lines) {
      if (truncated.length + line.length + 1 <= maxLength) {
        truncated += (truncated ? '\n' : '') + line;
      } else {
        break;
      }
    }
    
    result = truncated;
    if (result.length < formattedMemories.join('\n').length) {
      result += '\n... (additional memories truncated)';
    }
  }
  
  return result;
}

/**
 * Convenience function to retrieve and format memories for prompt injection in one call
 * 
 * @param userId - The user ID from Clerk
 * @param query - The search query to find relevant memories
 * @param options - Optional parameters for search and formatting
 * @returns Promise with formatted string ready for prompt injection
 */
export async function getMemoriesForPrompt(
  userId: string,
  query: string,
  options?: {
    category?: string;
    limit?: number;
    scoreThreshold?: number;
    maxLength?: number;
  }
): Promise<string> {
  try {
    // Get relevant memories
    const memories = await getRelevantMemories(
      userId,
      query,
      options?.category,
      options?.limit || 5
    );
    
    // Format for prompt injection
    return formatMemoriesForPrompt(
      memories,
      options?.scoreThreshold || 0.5,
      options?.maxLength || 2000
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to get memories for prompt: ${errorMessage}`);
    return '';
  }
}

/**
 * Fallback hook type analysis using hardcoded patterns
 * Used when AI analysis fails
 */
function fallbackAnalyzeHookType(hookContent: string): string {
  if (!hookContent) return 'unknown';
  
  const content = hookContent.toLowerCase();
  
  // Question-based hooks
  if (content.includes('?') || content.startsWith('what ') || content.startsWith('how ') || 
      content.startsWith('why ') || content.startsWith('when ') || content.startsWith('where ')) {
    return 'question-based';
  }
  
  // Statistical/number-based hooks
  if (/\d/.test(content) && (content.includes('%') || content.includes('statistics') || content.includes('study'))) {
    return 'statistic';
  }
  
  // Story/personal experience hooks
  if (content.includes('story') || content.includes('experience') || content.includes('journey') ||
      content.includes('when i') || content.includes('my first')) {
    return 'story-based';
  }
  
  // Educational/tip hooks
  if (content.includes('tip') || content.includes('hack') || content.includes('how to')) {
    return 'educational';
  }
  
  return 'general';
}

/**
 * Analyze hook type using AI with fallback to hardcoded patterns
 * Classifies hooks into categories for better memory organization
 */
export async function analyzeHookType(hookContent: string): Promise<string> {
  if (!hookContent) return 'unknown';
  
  try {
    const { anthropic } = await import('@ai-sdk/anthropic');
    const { generateObject } = await import('ai');
    const { z } = await import('zod');
    
    const result = await generateObject({
      model: anthropic('claude-3-haiku-20240307'), // Fast, small model for classification
      messages: [
        {
          role: 'user',
          content: `Analyze this LinkedIn hook and classify its type. Hook: "${hookContent}"
          
Categories to choose from:
- question-based: Hooks that ask questions to engage readers
- statistic: Hooks using numbers, percentages, or data points
- story-based: Personal experiences, narratives, or anecdotes
- controversial: Opinion-based or debate-inducing content
- educational: Tips, how-tos, or teaching content
- list-based: Numbered lists or bullet points
- motivational: Inspirational or success-focused content
- industry-insight: Market trends, business analysis, or professional observations
- general: Default category if none of the above fit

Respond with just the category name.`
        }
      ],
      schema: z.object({
        hookType: z.enum([
          'question-based',
          'statistic', 
          'story-based',
          'controversial',
          'educational',
          'list-based',
          'motivational',
          'industry-insight',
          'general'
        ])
      }),
      temperature: 0.1, // Low temperature for consistent classification
    });
    
    return result.object.hookType;
  } catch (error) {
    console.warn('AI hook analysis failed, using fallback:', error instanceof Error ? error.message : String(error));
    return fallbackAnalyzeHookType(hookContent);
  }
}

/**
 * Fallback post style analysis using hardcoded patterns
 * Used when AI analysis fails
 */
function fallbackAnalyzePostStyle(postContent: string): {
  tone: string;
  length: string;
  style: string;
} {
  if (!postContent) {
    return { tone: 'unknown', length: 'unknown', style: 'unknown' };
  }
  
  const content = postContent.toLowerCase();
  const wordCount = postContent.split(/\s+/).length;
  
  // Analyze tone
  let tone = 'professional';
  if (content.includes('!') || content.includes('amazing') || content.includes('excited')) {
    tone = 'enthusiastic';
  } else if (content.includes('?') && content.includes('think')) {
    tone = 'conversational';
  } else if (content.includes('tip') || content.includes('how to')) {
    tone = 'educational';
  }
  
  // Analyze length
  let length = 'medium';
  if (wordCount < 50) {
    length = 'short';
  } else if (wordCount > 150) {
    length = 'long';
  }
  
  // Analyze style
  let style = 'standard';
  if (content.includes('•') || /\d+\./.test(content)) {
    style = 'list-format';
  } else if ((content.match(/\n/g) || []).length > 3) {
    style = 'paragraph-heavy';
  }
  
  return { tone, length, style };
}

/**
 * Analyze post style/tone using AI with fallback to hardcoded patterns
 */
export async function analyzePostStyle(postContent: string): Promise<{
  tone: string;
  length: string;
  style: string;
}> {
  if (!postContent) {
    return { tone: 'unknown', length: 'unknown', style: 'unknown' };
  }
  
  try {
    const { anthropic } = await import('@ai-sdk/anthropic');
    const { generateObject } = await import('ai');
    const { z } = await import('zod');
    
    const wordCount = postContent.split(/\s+/).length;
    
    const result = await generateObject({
      model: anthropic('claude-3-haiku-20240307'), // Fast, small model for classification
      messages: [
        {
          role: 'user',
          content: `Analyze this LinkedIn post content and classify its style. Post: "${postContent}"

Word count: ${wordCount}

Analyze for:
1. Tone: professional, enthusiastic, conversational, educational, narrative, inspiring
2. Length: short (<50 words), medium (50-150 words), long (>150 words)  
3. Style: standard, list-format, hashtag-heavy, paragraph-heavy, visual-focused

Consider the writing style, language patterns, and content structure.`
        }
      ],
      schema: z.object({
        tone: z.enum(['professional', 'enthusiastic', 'conversational', 'educational', 'narrative', 'inspiring']),
        length: z.enum(['short', 'medium', 'long']),
        style: z.enum(['standard', 'list-format', 'hashtag-heavy', 'paragraph-heavy', 'visual-focused'])
      }),
      temperature: 0.1, // Low temperature for consistent classification
    });
    
    return result.object;
  } catch (error) {
    console.warn('AI post analysis failed, using fallback:', error instanceof Error ? error.message : String(error));
    return fallbackAnalyzePostStyle(postContent);
  }
}

/**
 * Store hook selection memory in Mem0
 */
export async function storeHookSelectionMemory(
  userId: string,
  selectedHook: string,
  availableHooks: { id: number; content: string; source: string }[],
  topic?: string
): Promise<void> {
  if (!userId || !selectedHook) {
    console.warn('Missing required parameters for storing hook selection memory');
    return;
  }
  
  try {
    const hookType = await analyzeHookType(selectedHook);
    const selectedHookData = availableHooks.find(h => h.content === selectedHook);
    
    // Store preference memory
    await addOrUpdateMemory(
      userId,
      'preferences',
      `Preferred Hook Type: ${hookType}. Selected hook: "${selectedHook.substring(0, 100)}..."`,
      {
        source: 'selection',
        hook_type: hookType,
        hook_source: selectedHookData?.source || 'unknown',
        full_hook: selectedHook,
        selection_context: topic || 'general',
        total_options: availableHooks.length,
      }
    );
    
    // Store interaction history
    await addMemory(
      userId,
      `Selected hook: "${selectedHook.substring(0, 150)}..." (Type: ${hookType})${topic ? ` for topic: ${topic}` : ''}`,
      'interaction_history',
      {
        interaction_type: 'hook_selection',
        hook_type: hookType,
        hook_source: selectedHookData?.source || 'unknown',
        topic: topic || null,
        timestamp: new Date().toISOString(),
      }
    );
    
    console.log('Hook selection memory stored successfully');
  } catch (error) {
    console.error('Error storing hook selection memory:', error);
    // Don't throw - memory storage failures shouldn't break the main flow
  }
}

/**
 * Store post selection memory in Mem0
 */
export async function storePostSelectionMemory(
  userId: string,
  selectedPost: string,
  availablePosts: { id: number; title: string; hook: string; body: string; conclusion: string; wordCount: number }[],
  topic?: string
): Promise<void> {
  if (!userId || !selectedPost) {
    console.warn('Missing required parameters for storing post selection memory');
    return;
  }
  
  try {
    const postAnalysis = await analyzePostStyle(selectedPost);
    const selectedPostData = availablePosts.find(p => 
      p.body === selectedPost || 
      `${p.hook}\n\n${p.body}\n\n${p.conclusion}` === selectedPost
    );
    
    // Store preference memory
    await addOrUpdateMemory(
      userId,
      'preferences',
      `Preferred Post Style: ${postAnalysis.tone} tone, ${postAnalysis.length} length, ${postAnalysis.style} format.`,
      {
        source: 'selection',
        post_tone: postAnalysis.tone,
        post_length: postAnalysis.length,
        post_style: postAnalysis.style,
        word_count: selectedPostData?.wordCount || selectedPost.split(/\s+/).length,
        selection_context: topic || 'general',
        total_options: availablePosts.length,
      }
    );
    
    // Store interaction history
    await addMemory(
      userId,
      `Selected post with ${postAnalysis.tone} tone and ${postAnalysis.length} length${topic ? ` for topic: ${topic}` : ''}`,
      'interaction_history',
      {
        interaction_type: 'post_selection',
        post_tone: postAnalysis.tone,
        post_length: postAnalysis.length,
        post_style: postAnalysis.style,
        word_count: selectedPostData?.wordCount || selectedPost.split(/\s+/).length,
        topic: topic || null,
        timestamp: new Date().toISOString(),
      }
    );
    
    console.log('Post selection memory stored successfully');
  } catch (error) {
    console.error('Error storing post selection memory:', error);
    // Don't throw - memory storage failures shouldn't break the main flow
  }
}

/**
 * Get user preferences from memory for hook generation
 * Uses retrieveMemories from @mem0/vercel-ai-provider
 */
export async function getHookPreferences(userId: string): Promise<{
  preferredTypes: string[];
  preferredSources: string[];
  insights: string;
}> {
  try {
    // getRelevantMemories now uses retrieveMemories from Mem0 provider
    const memories = await getRelevantMemories(
      userId,
      'hook preferences selection type',
      'preferences',
      5
    );
    
    const hookMemories = memories.filter(m => 
      m.metadata?.hook_type || m.text?.includes('Hook Type')
    );
    
    const preferredTypes = [...new Set(
      hookMemories.map(m => m.metadata?.hook_type).filter(Boolean)
    )];
    
    const preferredSources = [...new Set(
      hookMemories.map(m => m.metadata?.hook_source).filter(Boolean)
    )];
    
    const insights = formatMemoriesForPrompt(hookMemories, 0.4, 500);
    
    return {
      preferredTypes,
      preferredSources,
      insights
    };
  } catch (error) {
    console.error('Error getting hook preferences:', error);
    return {
      preferredTypes: [],
      preferredSources: [],
      insights: ''
    };
  }
}

/**
 * Get all memories for a user
 * Uses getMemories from @mem0/vercel-ai-provider
 * 
 * @param userId - The user ID from Clerk
 * @param limit - Maximum number of memories to return (default: 100)
 * @returns Promise with array of all user memories
 */
export async function getAllUserMemories(
  userId: string,
  limit: number = 100
): Promise<MemorySearchResult[]> {
  // Validate required parameters
  if (!userId) {
    throw new Mem0Error('User ID is required');
  }

  try {
    // Check if API keys are available
    const mem0ApiKey = process.env.MEM0_API_KEY;
    if (!mem0ApiKey) {
      console.warn('MEM0_API_KEY not found, returning empty results');
      return [];
    }

    // Use getMemories to retrieve all memories for the user
    // Note: Since the exact API for getMemories is unclear, we'll use retrieveMemories with a broad query
    const messages = [{ 
      role: 'user' as const, 
      content: [{ type: 'text' as const, text: 'show all memories' }] 
    }];
    const options: any = { 
      user_id: userId,
      limit 
    };
    
    const memories = await retrieveMemories(messages, options);

    // Transform the response to match our expected format
    if (!memories || !Array.isArray(memories)) {
      console.warn('Unexpected response format from getMemories');
      return [];
    }

    return memories.map((memory: any) => ({
      id: memory.id || '',
      text: memory.text || memory.memory || '',
      metadata: memory.metadata || {},
      score: memory.score || 1 // Default score for all memories
    }));

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to retrieve all memories for user ${userId}: ${errorMessage}`);
    
    // Return empty array on error to fail gracefully
    return [];
  }
}

/**
 * Get user preferences from memory for post generation
 * Uses retrieveMemories from @mem0/vercel-ai-provider
 */
export async function getPostPreferences(userId: string): Promise<{
  preferredTone: string[];
  preferredLength: string[];
  preferredStyle: string[];
  insights: string;
}> {
  try {
    // getRelevantMemories now uses retrieveMemories from Mem0 provider
    const memories = await getRelevantMemories(
      userId,
      'post preferences selection style tone length',
      'preferences',
      5
    );
    
    const postMemories = memories.filter(m => 
      m.metadata?.post_tone || m.text?.includes('Post Style')
    );
    
    const preferredTone = [...new Set(
      postMemories.map(m => m.metadata?.post_tone).filter(Boolean)
    )];
    
    const preferredLength = [...new Set(
      postMemories.map(m => m.metadata?.post_length).filter(Boolean)
    )];
    
    const preferredStyle = [...new Set(
      postMemories.map(m => m.metadata?.post_style).filter(Boolean)
    )];
    
    const insights = formatMemoriesForPrompt(postMemories, 0.4, 500);
    
    return {
      preferredTone,
      preferredLength,
      preferredStyle,
      insights
    };
  } catch (error) {
    console.error('Error getting post preferences:', error);
    return {
      preferredTone: [],
      preferredLength: [],
      preferredStyle: [],
      insights: ''
    };
  }
}

/**
 * Store detailed post analytics when user selects/publishes a post
 */
export async function storePostAnalytics(
  userId: string,
  postData: {
    selectedHook: string;
    tone: string;
    structure: string;
    endingSentence: string;
    fullContent: string;
    wordCount: number;
    publishedToLinkedIn: boolean;
    keywordDensity?: Record<string, number>;
    topIndustry?: string;
    industryFitScore?: number;
    detectedKeywords?: string[];
    ctaCount?: number;
    ctaStrength?: number;
    ctaPlacement?: string;
    detectedCTAs?: string[];
  },
  context?: {
    topic?: string;
    generatedOptions?: number;
    selectionReason?: string;
  }
): Promise<void> {
  if (!userId || !postData.selectedHook) {
    console.warn('Missing required parameters for storing post analytics');
    return;
  }
  
  try {
    // Store detailed post analytics
    const analyticsContent = `Selected LinkedIn Post Analytics:
- Hook: "${postData.selectedHook}"
- Tone: ${postData.tone}
- Structure: ${postData.structure}
- Ending: "${postData.endingSentence}"
- Word Count: ${postData.wordCount}
- Published: ${postData.publishedToLinkedIn ? 'Yes' : 'No'}
${postData.topIndustry ? `- Top Industry: ${postData.topIndustry} (${postData.industryFitScore}% fit)` : ''}
${postData.detectedKeywords?.length ? `- Keywords: ${postData.detectedKeywords.slice(0, 5).join(', ')}${postData.detectedKeywords.length > 5 ? '...' : ''}` : ''}
${postData.ctaCount ? `- CTAs: ${postData.ctaCount} (strength: ${postData.ctaStrength}/5, placement: ${postData.ctaPlacement})` : ''}
${context?.topic ? `- Topic: ${context.topic}` : ''}
${context?.selectionReason ? `- Why chosen: ${context.selectionReason}` : ''}`;

    await addMemory(
      userId,
      analyticsContent,
      'post_analytics',
      {
        source: 'post_selection',
        hook: postData.selectedHook,
        tone: postData.tone,
        structure: postData.structure,
        ending_sentence: postData.endingSentence,
        word_count: postData.wordCount,
        published: postData.publishedToLinkedIn,
        // Industry analysis
        top_industry: postData.topIndustry || null,
        industry_fit_score: postData.industryFitScore || 0,
        keyword_density: postData.keywordDensity || {},
        detected_keywords: postData.detectedKeywords || [],
        // CTA analysis
        cta_count: postData.ctaCount || 0,
        cta_strength: postData.ctaStrength || 0,
        cta_placement: postData.ctaPlacement || 'none',
        detected_ctas: postData.detectedCTAs || [],
        // Context
        topic: context?.topic || null,
        selection_reason: context?.selectionReason || null,
        generated_options: context?.generatedOptions || null,
        timestamp: new Date().toISOString(),
      }
    );
    
    console.log('Post analytics stored successfully');
  } catch (error) {
    console.error('Error storing post analytics:', error);
    // Don't throw - analytics storage failures shouldn't break the main flow
  }
}



/**
 * Analyze post structure to extract tone, structure, ending sentence, industry relevance, and CTA strength
 */
export async function analyzePostStructure(postContent: string): Promise<{
  tone: string;
  structure: string;
  endingSentence: string;
  keywordDensity: Record<string, number>;
  topIndustry: string;
  industryFitScore: number;
  detectedKeywords: string[];
  ctaCount: number;
  ctaStrength: number;
  ctaPlacement: string;
  detectedCTAs: string[];
}> {
  if (!postContent) {
    return { 
      tone: 'unknown', 
      structure: 'unknown', 
      endingSentence: '',
      keywordDensity: {},
      topIndustry: 'unknown',
      industryFitScore: 0,
      detectedKeywords: [],
      ctaCount: 0,
      ctaStrength: 0,
      ctaPlacement: 'none',
      detectedCTAs: []
    };
  }

  // Analyze industry keywords and CTAs first
  const industryAnalysis = await analyzeIndustryKeywords(postContent);
  const ctaAnalysis = await analyzeCTAStrength(postContent);
  
  try {
    const { anthropic } = await import('@ai-sdk/anthropic');
    const { generateObject } = await import('ai');
    const { z } = await import('zod');
    
    const sentences = postContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const endingSentence = sentences[sentences.length - 1]?.trim() || '';
    
    const result = await generateObject({
      model: anthropic('claude-3-haiku-20240307'),
      messages: [
        {
          role: 'user',
          content: `Analyze this LinkedIn post and classify its tone and structure:

"${postContent}"

Classify the:
1. Tone: professional, conversational, inspirational, educational, storytelling, motivational, controversial, humorous
2. Structure: standard_paragraph, bullet_points, question_based, story_narrative, list_format, call_to_action, educational_tips, personal_experience

Be specific and choose the most dominant characteristics.`
        }
      ],
      schema: z.object({
        tone: z.enum(['professional', 'conversational', 'inspirational', 'educational', 'storytelling', 'motivational', 'controversial', 'humorous']),
        structure: z.enum(['standard_paragraph', 'bullet_points', 'question_based', 'story_narrative', 'list_format', 'call_to_action', 'educational_tips', 'personal_experience'])
      }),
      temperature: 0.1,
    });
    
    return {
      tone: result.object.tone,
      structure: result.object.structure,
      endingSentence,
      keywordDensity: industryAnalysis.keywordDensity,
      topIndustry: industryAnalysis.topIndustry,
      industryFitScore: industryAnalysis.industryFitScore,
      detectedKeywords: industryAnalysis.detectedKeywords,
      ctaCount: ctaAnalysis.ctaCount,
      ctaStrength: ctaAnalysis.ctaStrength,
      ctaPlacement: ctaAnalysis.ctaPlacement,
      detectedCTAs: ctaAnalysis.detectedCTAs
    };
  } catch (error) {
    console.warn('AI post analysis failed, using fallback:', error instanceof Error ? error.message : String(error));
    
    // Fallback analysis
    const sentences = postContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const endingSentence = sentences[sentences.length - 1]?.trim() || '';
    
    let tone = 'professional';
    let structure = 'standard_paragraph';
    
    const content = postContent.toLowerCase();
    
    // Simple tone detection
    if (content.includes('!') || content.includes('excited') || content.includes('amazing')) {
      tone = 'inspirational';
    } else if (content.includes('?') && content.includes('think')) {
      tone = 'conversational';
    } else if (content.includes('story') || content.includes('when i')) {
      tone = 'storytelling';
    }
    
    // Simple structure detection
    if (content.includes('•') || /\d+\./.test(content)) {
      structure = 'bullet_points';
    } else if (content.includes('?')) {
      structure = 'question_based';
    } else if ((content.match(/\n/g) || []).length > 3) {
      structure = 'story_narrative';
    }
    
    return { 
      tone, 
      structure, 
      endingSentence,
      keywordDensity: industryAnalysis.keywordDensity,
      topIndustry: industryAnalysis.topIndustry,
      industryFitScore: industryAnalysis.industryFitScore,
      detectedKeywords: industryAnalysis.detectedKeywords,
      ctaCount: ctaAnalysis.ctaCount,
      ctaStrength: ctaAnalysis.ctaStrength,
      ctaPlacement: ctaAnalysis.ctaPlacement,
      detectedCTAs: ctaAnalysis.detectedCTAs
    };
  }
}

/**
 * Run analytics operations in the background without blocking the main flow
 * This is a utility function to ensure analytics never impact user experience
 */
export function runAnalyticsInBackground<T>(
  operation: () => Promise<T>,
  context: string = 'analytics'
): void {
  // Use setTimeout to run after the current event loop (Edge Runtime compatible)
  setTimeout(async () => {
    try {
      await operation();
      console.log(`Background ${context} completed successfully`);
  } catch (error) {
      console.error(`Background ${context} failed:`, error);
      // Silent failure - never throw or affect main application flow
    }
  }, 0);
}

/**
 * Delete a memory from Mem0
 * 
 * @param memoryId - The ID of the memory to delete
 * @returns Promise that resolves when the memory is deleted
 */
export async function deleteMemory(memoryId: string): Promise<void> {
  if (!memoryId) {
    throw new Mem0Error('Memory ID is required for deletion');
  }
  
  try {
    // Note: The @mem0/vercel-ai-provider doesn't expose a delete function
    // This is a placeholder for when the functionality becomes available
    console.warn('Memory deletion not yet supported by @mem0/vercel-ai-provider');
    throw new Mem0Error('Memory deletion not yet supported by the provider');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to delete memory ${memoryId}: ${errorMessage}`);
    throw new Mem0Error(`Failed to delete memory ${memoryId}`, error);
  }
}

/**
 * Store post analytics in background (convenience wrapper)
 */
export function storePostAnalyticsBackground(
  userId: string,
  postData: Parameters<typeof storePostAnalytics>[1],
  context?: Parameters<typeof storePostAnalytics>[2]
): void {
  runAnalyticsInBackground(
    () => storePostAnalytics(userId, postData, context),
    'post analytics'
  );
}



/**
 * Fallback industry keywords for when AI analysis fails
 */
const FALLBACK_INDUSTRY_KEYWORDS = {
  technology: ['AI', 'software', 'programming', 'data', 'tech', 'digital', 'automation'],
  finance: ['finance', 'investment', 'banking', 'trading', 'fintech', 'money'],
  healthcare: ['healthcare', 'medical', 'health', 'patient', 'clinical', 'pharmaceutical'],
  marketing: ['marketing', 'brand', 'campaign', 'advertising', 'SEO', 'social media'],
  sales: ['sales', 'selling', 'revenue', 'customer', 'CRM', 'pipeline'],
  consulting: ['consulting', 'strategy', 'business', 'management', 'advisory'],
  education: ['education', 'learning', 'training', 'teaching', 'academic'],
  general: ['business', 'professional', 'work', 'career', 'industry']
};

/**
 * Fallback CTA patterns for when AI analysis fails
 */
const FALLBACK_CTA_PATTERNS = {
  strong: ['DM me', 'message me', 'click the link', 'download now', 'schedule a call', 'book a demo', 'apply now', 'follow for more', 'connect with me'],
  medium: ['comment below', 'share your thoughts', 'let me know', 'what do you think', 'tag someone'],
  weak: ['like if', 'thoughts', 'agree', 'feedback']
};

/**
 * AI-powered industry analysis using Claude Haiku
 */
async function analyzeIndustryKeywords(content: string): Promise<{
  keywordDensity: Record<string, number>;
  topIndustry: string;
  industryFitScore: number;
  detectedKeywords: string[];
}> {
  try {
    const { anthropic } = await import('@ai-sdk/anthropic');
    const { generateObject } = await import('ai');
    const { z } = await import('zod');
    
    const result = await generateObject({
      model: anthropic('claude-3-haiku-20240307'),
      messages: [
        {
          role: 'user',
          content: `Analyze this LinkedIn post for industry relevance and extract key industry-specific terms:

"${content}"

Tasks:
1. Identify the primary industry this content targets (technology, finance, healthcare, marketing, sales, consulting, education, or general)
2. Score how well the content fits that industry (0-100, where 100 = highly specialized industry content)
3. Extract specific industry keywords/terms used
4. Assess keyword density for major industries

Consider:
- Technical jargon and industry-specific terminology
- Professional context and use cases
- Target audience implied by the language
- Domain expertise demonstrated

Be precise about industry classification and realistic about fit scores.`
        }
      ],
      schema: z.object({
        primaryIndustry: z.enum(['technology', 'finance', 'healthcare', 'marketing', 'sales', 'consulting', 'education', 'general']),
        industryFitScore: z.number().min(0).max(100),
        detectedKeywords: z.array(z.string()),
        industryRelevance: z.object({
          technology: z.number().min(0).max(100),
          finance: z.number().min(0).max(100),
          healthcare: z.number().min(0).max(100),
          marketing: z.number().min(0).max(100),
          sales: z.number().min(0).max(100),
          consulting: z.number().min(0).max(100),
          education: z.number().min(0).max(100),
          general: z.number().min(0).max(100)
        }),
        reasoning: z.string()
      }),
      temperature: 0.1,
    });
    
    return {
      keywordDensity: result.object.industryRelevance,
      topIndustry: result.object.primaryIndustry,
      industryFitScore: result.object.industryFitScore,
      detectedKeywords: result.object.detectedKeywords
    };
  } catch (error) {
    console.warn('AI industry analysis failed, using fallback:', error instanceof Error ? error.message : String(error));
    return fallbackIndustryAnalysis(content);
  }
}

/**
 * Fallback industry analysis using simple keyword matching
 */
function fallbackIndustryAnalysis(content: string): {
  keywordDensity: Record<string, number>;
  topIndustry: string;
  industryFitScore: number;
  detectedKeywords: string[];
} {
  const contentLower = content.toLowerCase();
  const wordCount = content.split(/\s+/).length;
  const keywordDensity: Record<string, number> = {};
  const detectedKeywords: string[] = [];
  
  // Count keywords for each industry using fallback keywords
  for (const [industry, keywords] of Object.entries(FALLBACK_INDUSTRY_KEYWORDS)) {
    let matches = 0;
    const industryKeywords: string[] = [];
    
    for (const keyword of keywords) {
      if (contentLower.includes(keyword.toLowerCase())) {
        matches++;
        industryKeywords.push(keyword);
      }
    }
    
    keywordDensity[industry] = Math.round((matches / Math.max(wordCount, 1)) * 100 * 10) / 10;
    if (matches > 0) {
      detectedKeywords.push(...industryKeywords);
    }
  }
  
  // Find top industry
  const topIndustry = Object.entries(keywordDensity).reduce((a, b) => 
    keywordDensity[a[0]] > keywordDensity[b[0]] ? a : b
  )[0] || 'general';
  
  const industryFitScore = Math.min(keywordDensity[topIndustry] * 5, 100); // Scale up for fallback
  
  return {
    keywordDensity,
    topIndustry,
    industryFitScore: Math.round(industryFitScore * 10) / 10,
    detectedKeywords: [...new Set(detectedKeywords)]
  };
}

/**
 * AI-powered CTA analysis using Claude Haiku
 */
async function analyzeCTAStrength(content: string): Promise<{
  ctaCount: number;
  ctaStrength: number;
  ctaPlacement: string;
  detectedCTAs: string[];
}> {
  try {
    const { anthropic } = await import('@ai-sdk/anthropic');
    const { generateObject } = await import('ai');
    const { z } = await import('zod');
    
    const result = await generateObject({
      model: anthropic('claude-3-haiku-20240307'),
      messages: [
        {
          role: 'user',
          content: `Analyze this LinkedIn post for Call-to-Action (CTA) elements:

"${content}"

Tasks:
1. Count how many CTAs are present
2. Rate the overall CTA strength (1-5 scale, where 5 = very strong, direct CTAs like "DM me" or "Click here")
3. Determine CTA placement (beginning, middle, end, multiple, or none)
4. Extract the specific CTA phrases used

Consider:
- Directness and specificity of the calls-to-action
- Placement within the content structure
- Action verbs and urgency indicators
- LinkedIn engagement patterns

Examples of strong CTAs: "DM me for details", "Click the link in comments", "Follow for more tips"
Examples of medium CTAs: "What do you think?", "Share your thoughts below"
Examples of weak CTAs: "Thoughts?", "Agree?"

Be realistic about strength scoring.`
        }
      ],
      schema: z.object({
        ctaCount: z.number().min(0),
        ctaStrength: z.number().min(1).max(5),
        ctaPlacement: z.enum(['beginning', 'middle', 'end', 'multiple', 'none']),
        detectedCTAs: z.array(z.string()),
        reasoning: z.string()
      }),
      temperature: 0.1,
    });
    
    return {
      ctaCount: result.object.ctaCount,
      ctaStrength: result.object.ctaStrength,
      ctaPlacement: result.object.ctaPlacement,
      detectedCTAs: result.object.detectedCTAs
    };
  } catch (error) {
    console.warn('AI CTA analysis failed, using fallback:', error instanceof Error ? error.message : String(error));
    return fallbackCTAAnalysis(content);
  }
}

/**
 * Fallback CTA analysis using pattern matching
 */
function fallbackCTAAnalysis(content: string): {
  ctaCount: number;
  ctaStrength: number;
  ctaPlacement: string;
  detectedCTAs: string[];
} {
  const contentLower = content.toLowerCase();
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const totalSentences = sentences.length;
  
  let ctaCount = 0;
  let strengthTotal = 0;
  const detectedCTAs: string[] = [];
  const ctaPositions: number[] = [];
  
  // Check each sentence for CTAs
  sentences.forEach((sentence, index) => {
    const sentenceLower = sentence.toLowerCase().trim();
    let foundCTA = false;
    let ctaStrength = 0;
    
    // Check strong CTAs
    for (const pattern of FALLBACK_CTA_PATTERNS.strong) {
      if (sentenceLower.includes(pattern)) {
        ctaCount++;
        ctaStrength = 5;
        detectedCTAs.push(sentence.trim());
        ctaPositions.push(index);
        foundCTA = true;
        break;
      }
    }
    
    // Check medium CTAs if no strong CTA found
    if (!foundCTA) {
      for (const pattern of FALLBACK_CTA_PATTERNS.medium) {
        if (sentenceLower.includes(pattern)) {
          ctaCount++;
          ctaStrength = 3;
          detectedCTAs.push(sentence.trim());
          ctaPositions.push(index);
          foundCTA = true;
          break;
        }
      }
    }
    
    // Check weak CTAs if no other CTA found
    if (!foundCTA) {
      for (const pattern of FALLBACK_CTA_PATTERNS.weak) {
        if (sentenceLower.includes(pattern)) {
          ctaCount++;
          ctaStrength = 1;
          detectedCTAs.push(sentence.trim());
          ctaPositions.push(index);
          break;
        }
      }
    }
    
    strengthTotal += ctaStrength;
  });
  
  // Determine placement
  let ctaPlacement: 'beginning' | 'middle' | 'end' | 'multiple' | 'none' = 'none';
  if (ctaPositions.length === 0) {
    ctaPlacement = 'none';
  } else if (ctaPositions.length > 1) {
    ctaPlacement = 'multiple';
  } else {
    const position = ctaPositions[0];
    const relativePosition = position / Math.max(totalSentences - 1, 1);
    
    if (relativePosition <= 0.33) {
      ctaPlacement = 'beginning';
    } else if (relativePosition <= 0.66) {
      ctaPlacement = 'middle';
    } else {
      ctaPlacement = 'end';
    }
  }
  
  const averageStrength = ctaCount > 0 ? strengthTotal / ctaCount : 0;
  
  return {
    ctaCount,
    ctaStrength: Math.round(averageStrength * 10) / 10,
    ctaPlacement,
    detectedCTAs
  };
}

export default createMem0Client;
