import { z } from 'zod';
import { tool, type UIMessageStreamWriter } from 'ai';
import Exa from 'exa-js';
import type { ChatMessage, UserType } from '@/lib/types';

interface ExaSearchProps {
  session: {
    user: {
      id: string;
      type: UserType;
    };
  };
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

export const exaSearch = ({ session, dataStream }: ExaSearchProps) =>
  tool({
    description: 'Search the web for current, accurate information using Exa\'s neural search. Use this for finding recent articles, news, research papers, or any current information that may not be in your training data.',
    inputSchema: z.object({
      query: z
        .string()
        .describe('The search query. Use natural language - e.g., "latest developments in AI safety" or "recent climate change research 2024"'),
      numResults: z
        .number()
        .min(1)
        .max(10)
        .default(3)
        .describe('Number of search results to return (1-10, default: 3)'),
    }),
    execute: async ({ query, numResults = 3 }) => {
      try {
        // Check if API key is configured
        const apiKey = process.env.EXA_API_KEY;
        if (!apiKey) {
          return {
            error: 'Exa API key is not configured. Please set EXA_API_KEY environment variable.',
          };
        }

        // Initialize Exa client
        const exa = new Exa(apiKey);

        // Perform search with content retrieval
        const response = await exa.searchAndContents(query, {
          numResults,
          text: true,
          summary: true,
          startPublishedDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last year
        });

        // Format results for the LLM
        const searchResults = response.results.map((result, index) => ({
          title: result.title,
          url: result.url,
          publishedDate: result.publishedDate,
          author: result.author,
          summary: result.summary,
          text: result.text?.slice(0, 1000) + (result.text && result.text.length > 1000 ? '...' : ''), // Truncate long content
          score: result.score,
        }));

                 // Log search results for debugging
        console.log(`Exa search completed: ${searchResults.length} results for "${query}"`);

        return {
          query,
          searchType: 'neural', // Exa automatically chooses the best search type
          numResults: searchResults.length,
          results: searchResults,
          summary: `Found ${searchResults.length} relevant results for "${query}".`,
        };
      } catch (error) {
        console.error('Exa search error:', error);
        return {
          error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  }); 