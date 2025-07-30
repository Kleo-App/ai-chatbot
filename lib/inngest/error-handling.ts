export class LinkedInPublishError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'LinkedInPublishError';
  }
}

export class TokenRefreshError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenRefreshError';
  }
}

export class DocumentNotFoundError extends Error {
  constructor(documentId: string) {
    super(`Document ${documentId} not found or not scheduled`);
    this.name = 'DocumentNotFoundError';
  }
}

export class LinkedInConnectionError extends Error {
  constructor(userId: string) {
    super(`No active LinkedIn connection found for user ${userId}`);
    this.name = 'LinkedInConnectionError';
  }
}

/**
 * Determines if an error is recoverable and should be retried
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof LinkedInPublishError) {
    return error.recoverable;
  }

  if (error instanceof TokenRefreshError) {
    return false; // User needs to manually reconnect
  }

  if (error instanceof DocumentNotFoundError) {
    return false; // Document was likely deleted or unscheduled
  }

  if (error instanceof LinkedInConnectionError) {
    return false; // User needs to reconnect LinkedIn
  }

  // For unknown errors, retry a few times
  return true;
}

/**
 * Gets retry delay based on error type and attempt number
 */
export function getRetryDelay(error: unknown, attemptNumber: number): number {
  if (error instanceof LinkedInPublishError && error.retryAfter) {
    return error.retryAfter * 1000; // Convert to milliseconds
  }

  // Exponential backoff: 1s, 2s, 4s, 8s...
  return Math.min(1000 * Math.pow(2, attemptNumber - 1), 30000); // Max 30 seconds
}

/**
 * Handles LinkedIn API errors and converts them to appropriate error types
 */
export function handleLinkedInAPIError(
  response: Response,
  errorData: string
): LinkedInPublishError {
  const status = response.status;

  if (status === 401) {
    throw new TokenRefreshError('LinkedIn token expired or invalid');
  }

  if (status === 429) {
    // Rate limited - check for retry-after header
    const retryAfter = response.headers.get('retry-after');
    const retryDelay = retryAfter ? parseInt(retryAfter, 10) : 60;
    
    return new LinkedInPublishError(
      'LinkedIn API rate limit exceeded',
      'RATE_LIMIT_EXCEEDED',
      true,
      retryDelay
    );
  }

  if (status >= 500) {
    return new LinkedInPublishError(
      `LinkedIn API server error: ${errorData}`,
      'SERVER_ERROR',
      true // Retry server errors
    );
  }

  if (status >= 400) {
    return new LinkedInPublishError(
      `LinkedIn API client error: ${errorData}`,
      'CLIENT_ERROR',
      false // Don't retry client errors
    );
  }

  return new LinkedInPublishError(
    `LinkedIn API error: ${errorData}`,
    'UNKNOWN_ERROR',
    true
  );
} 