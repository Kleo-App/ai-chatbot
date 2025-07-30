# LinkedIn Automated Scheduling System

This document explains how the automated LinkedIn posting system works in Kleo.

## Overview

The LinkedIn scheduling system uses [Inngest](https://www.inngest.com/) to automatically publish scheduled LinkedIn posts at the correct time in the user's timezone. When a user schedules a post, it creates an Inngest job that will execute at the specified time to publish the post to LinkedIn.

## Architecture

### Components

1. **Inngest Client** (`lib/inngest/client.ts`) - Main Inngest configuration
2. **Inngest Functions** (`lib/inngest/functions.ts`) - Background job definitions
3. **Helper Functions** (`lib/inngest/helpers.ts`) - Utilities for scheduling/canceling posts
4. **Error Handling** (`lib/inngest/error-handling.ts`) - Custom error types and retry logic
5. **API Routes** (`app/api/inngest/route.ts`, `app/api/posts/schedule/route.ts`) - HTTP endpoints

### Workflow

1. **User schedules a post** → Frontend calls `/api/posts/schedule`
2. **Schedule API** → Creates Inngest job with `linkedin/post.scheduled` event
3. **Inngest waits** → Until the scheduled time in the user's timezone
4. **Publish job triggers** → `linkedin/post.publish` event is sent
5. **Post gets published** → LinkedIn API call + database status update

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm add inngest
```

### 2. Environment Variables

Add these to your `.env.local`:

```env
# Required for Inngest
INNGEST_EVENT_KEY=your_event_key_here
INNGEST_SIGNING_KEY=your_signing_key_here

# Required for LinkedIn publishing
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

### 3. Vercel Integration

1. Install the [Inngest Vercel Integration](https://vercel.com/integrations/inngest)
2. Connect your Vercel project to Inngest
3. This automatically sets the required environment variables and syncs functions on deploy

### 4. Database Schema

The system uses the existing `Document` table with these fields:

- `status`: 'draft' | 'scheduled' | 'published'
- `scheduledAt`: Timestamp when post should be published
- `scheduledTimezone`: User's timezone for proper scheduling
- `publishedAt`: When the post was actually published

## Key Features

### Timezone Support

- Posts are scheduled in the user's local timezone
- Inngest handles timezone conversion automatically
- Uses `step.sleepUntil()` for precise timing

### Error Handling & Retries

- **Token Refresh**: Automatically refreshes expired LinkedIn tokens
- **Rate Limiting**: Handles LinkedIn API rate limits with exponential backoff
- **Retry Logic**: Built-in retries for transient failures
- **Custom Errors**: Specific error types for different failure scenarios

### Cancellation & Rescheduling

- **Cancel**: When users unschedule posts, the Inngest job is cancelled
- **Reschedule**: Cancels old job and creates new one with updated time
- **Idempotent**: Safe to call multiple times

## API Endpoints

### Schedule a Post

```http
POST /api/posts/schedule
Content-Type: application/json

{
  "documentId": "doc_123",
  "scheduledAt": "2024-01-15T09:00:00.000Z",
  "timezone": "America/New_York"
}
```

### Cancel Scheduled Post

```http
DELETE /api/posts/schedule
Content-Type: application/json

{
  "documentId": "doc_123"
}
```

## Inngest Functions

### `scheduleLinkedInPost`

- **Trigger**: `linkedin/post.scheduled` event
- **Purpose**: Waits until scheduled time, then triggers publish
- **Timezone**: Respects user's timezone setting

### `publishLinkedInPost`

- **Trigger**: `linkedin/post.publish` event
- **Purpose**: Actually publishes to LinkedIn API
- **Features**: Token refresh, error handling, status updates
- **Retries**: 3 attempts with exponential backoff

### `cancelScheduledLinkedInPost`

- **Trigger**: `linkedin/post.cancel` event
- **Purpose**: Cancels scheduled post and updates database

## Error Scenarios

### Token Expired

- Attempts to refresh using refresh token
- If refresh fails, job fails with `TokenRefreshError`
- User needs to reconnect LinkedIn

### Document Not Found

- Post was deleted or unscheduled after job was created
- Job fails immediately (no retry)

### LinkedIn API Errors

- **Rate Limiting**: Retries after specified delay
- **Server Errors**: Retries with exponential backoff
- **Client Errors**: Fails immediately (bad request, etc.)

### Connection Missing

- No active LinkedIn connection found
- Job fails immediately
- User needs to connect LinkedIn

## Monitoring

### Inngest Dashboard

- View job execution history
- Monitor success/failure rates
- Debug failed jobs
- Replay failed jobs

### Database Queries

- `getScheduledPosts()` - Get user's scheduled posts
- `getPostsScheduledBetween()` - Get posts in date range
- `getOverdueScheduledPosts()` - Find posts that should have been published

## Testing

### Local Development

1. Start Inngest dev server:

```bash
npx inngest-cli@latest dev
```

2. Start your Next.js app:

```bash
pnpm dev
```

3. Inngest will automatically discover your functions at `http://localhost:3000/api/inngest`

### Manual Testing

You can manually trigger events for testing:

```typescript
import { inngest } from "@/lib/inngest/client";

// Schedule a test post for 1 minute from now
await inngest.send({
  name: "linkedin/post.scheduled",
  data: {
    documentId: "test-doc-id",
    userId: "test-user-id",
    scheduledAt: new Date(Date.now() + 60000).toISOString(),
    timezone: "America/New_York",
  },
});
```

## Best Practices

### Scheduling

- Always validate LinkedIn connection before scheduling
- Use user's detected timezone as default
- Handle timezone changes gracefully

### Error Handling

- Provide clear error messages to users
- Log errors for debugging
- Graceful degradation when Inngest is unavailable

### Performance

- Use database indexes on `status` and `scheduledAt` fields
- Batch operations when possible
- Monitor job execution times

## Troubleshooting

### Job Not Executing

1. Check Inngest dashboard for job status
2. Verify environment variables are set
3. Ensure LinkedIn connection is active
4. Check for quota limits

### Publishing Failures

1. Check LinkedIn API status
2. Verify token hasn't expired
3. Check post content for policy violations
4. Monitor rate limits

### Database Issues

1. Verify document exists and is scheduled
2. Check user permissions
3. Ensure database connection is healthy

## Security Considerations

- Environment variables are encrypted in Vercel
- LinkedIn tokens are refreshed automatically
- Database access is user-scoped
- All API calls are authenticated
