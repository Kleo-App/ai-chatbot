<a href="https://chat.vercel.ai/">
  <img alt="Next.js 14 and App Router-ready AI chatbot." src="app/(chat)/opengraph-image.png">
  <h1 align="center">Chat SDK</h1>
</a>

<p align="center">
    Chat SDK is a free, open-source template built with Next.js and the AI SDK that helps you quickly build powerful chatbot applications.
</p>

<p align="center">
  <a href="https://chat-sdk.dev"><strong>Read Docs</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

- [Next.js](https://nextjs.org) App Router
- React Server Components (RSCs), Suspense, and Server Actions
- [Vercel AI SDK](https://sdk.vercel.ai/docs) for streaming chat UI
- Support for multiple LLM providers:
  - [xAI](https://x.ai) (default)
  - [OpenAI](https://openai.com)
  - [Anthropic](https://anthropic.com)
  - [Cohere](https://cohere.com/)
  - And [many more](https://sdk.vercel.ai/providers/ai-sdk-providers)
- **Exa Web Search** - Neural search powered by Exa for finding current, accurate information
- Document creation and editing with AI
- Weather information tool
- Suggestion system for content improvement
- [shadcn/ui](https://ui.shadcn.com)
- Data Persistence with [Vercel Postgres](https://vercel.com/storage/postgres)
- [NextAuth.js](https://github.com/nextauthjs/next-auth) for authentication

## Model Providers

This template ships with [xAI](https://x.ai) `grok-2-1212` as the default chat model. However, with the [AI SDK](https://sdk.vercel.ai/docs), you can switch LLM providers to [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), and [many more](https://sdk.vercel.ai/providers/ai-sdk-providers) with just a few lines of code.

## Deploy Your Own

You can deploy your own version of the Next.js AI Chatbot to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot&env=AUTH_SECRET&envDescription=Learn+more+about+how+to+get+the+API+Keys+for+the+application&envLink=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot%2Fblob%2Fmain%2F.env.example&demo-title=AI+Chatbot&demo-description=An+Open-Source+AI+Chatbot+Template+Built+With+Next.js+and+the+AI+SDK+by+Vercel.&demo-url=https%3A%2F%2Fchat.vercel.ai&products=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22ai%22%2C%22productSlug%22%3A%22grok%22%2C%22integrationSlug%22%3A%22xai%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22neon%22%2C%22integrationSlug%22%3A%22neon%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22upstash-kv%22%2C%22integrationSlug%22%3A%22upstash%22%7D%2C%7B%22type%22%3A%22blob%22%7D%5D)

## Running locally

You will need to configure the following environment variables to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

### Required Environment Variables

```bash
# Anthropic API key for Claude models
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Authentication secret for Clerk
AUTH_SECRET=your_auth_secret_here

# Clerk authentication configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Database configuration (PostgreSQL)
DATABASE_URL=your_postgresql_connection_string_here

# Exa API key for web search functionality
EXA_API_KEY=your_exa_api_key_here
```

### Optional Environment Variables

```bash
# Langfuse for AI observability
LANGFUSE_SECRET_KEY=your_langfuse_secret_key_here
LANGFUSE_PUBLIC_KEY=your_langfuse_public_key_here
LANGFUSE_HOST=https://cloud.langfuse.com

# Deepgram for transcription
DEEPGRAM_API_KEY=your_deepgram_api_key_here

# LinkedIn integration
LINKEDIN_CLIENT_ID=your_linkedin_client_id_here
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret_here

# Loops for email marketing
LOOPS_API_KEY=your_loops_api_key_here
```

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various AI and authentication provider accounts.

### Getting API Keys

1. **Exa API Key**: Sign up at [exa.ai](https://exa.ai) to get your API key for web search functionality
2. **Anthropic API Key**: Get your API key from [console.anthropic.com](https://console.anthropic.com)
3. **Clerk Keys**: Set up authentication at [clerk.com](https://clerk.com)
4. **Database**: Set up a PostgreSQL database (recommended: [Vercel Postgres](https://vercel.com/storage/postgres))

5. Install Vercel CLI: `npm i -g vercel`
6. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
7. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000).

## LinkedIn Hooks Library

The app includes a library of LinkedIn hooks and templates that users can browse and use to generate content.

### Uploading Hooks from CSV

To upload hooks from a CSV file:

1. Prepare your CSV file with the following columns:

   - `Title`: The name/title of the hook
   - `Tag(s)`: Comma-separated tags for categorization
   - `Template`: The actual hook template text
   - `Image`: Optional image URL
   - `Post URL`: Optional URL to original LinkedIn post

2. Run the upload script:

   ```bash
   pnpm upload:hooks path/to/your/hooks.csv
   ```

3. The script will clear existing hooks and upload the new ones from your CSV file.

### Using the Hooks Library

Users can:

- Browse all available hooks in the Library section
- Copy hook templates to clipboard
- Click "Write a Post Like This" to start a guided writing session
- View original posts for inspiration (if URL provided)

The "Write a Post Like This" feature creates a new chat session with the selected hook template and user's specified topic, then uses AI to help write a compelling LinkedIn post.
