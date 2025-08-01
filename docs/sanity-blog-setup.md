# Sanity Blog Setup Guide

This guide will help you set up the blog functionality using Sanity CMS.

## 1. Create a Sanity Account

1. Go to [sanity.io](https://sanity.io) and sign up for a free account
2. Create a new project
3. Choose a project name and dataset name (usually "production")

## 2. Configure Environment Variables

Add these variables to your `.env.local` file:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
NEXT_PUBLIC_SANITY_DATASET=production
```

You can find your project ID in the Sanity dashboard.

## 3. Set Up Sanity Studio

### Option A: Use Sanity Studio (Recommended)

1. Create a new directory for your Sanity studio:

```bash
npx create-sanity@latest
```

2. Follow the prompts and use the same project ID as above

3. Copy the schema from `sanity/schema.ts` to your studio's schema files

### Option B: Use the schemas directly

The schemas are already defined in `sanity/schema.ts`. You can copy these to your Sanity studio or use them with Sanity's APIs directly.

## 4. Schema Structure

The blog uses these content types:

- **Blog Post** (`blogPost`): Main blog posts with title, content, author, categories, etc.
- **Author** (`author`): Author information with bio and image
- **Category** (`category`): Post categories for organization
- **Block Content** (`blockContent`): Rich text content structure

## 5. Sample Content

To test the blog, create some sample content in your Sanity studio:

1. Create at least one Author
2. Create a few Categories
3. Create some Blog Posts with:
   - Title and slug
   - Author reference
   - Categories
   - Main image
   - Excerpt
   - Body content
   - Published date

## 6. Blog Pages

The blog includes:

- **Blog Directory** (`/blog`): Lists all published blog posts
- **Blog Post Detail** (`/blog/[slug]`): Individual blog post pages

Both pages match the logged-out homepage design with:

- Sticky header with blog navigation
- Background gradient
- Responsive card layouts
- Proper typography and spacing

## 7. Features

- ✅ Responsive design matching your logged-out homepage
- ✅ Blog link in the logged-out header
- ✅ Rich text content with Portable Text
- ✅ Image optimization with Sanity's CDN
- ✅ Categories and author information
- ✅ Reading time estimates
- ✅ Related posts
- ✅ SEO-friendly URLs with slugs

## Troubleshooting

If you encounter issues:

1. Make sure your environment variables are correctly set
2. Verify your Sanity project ID and dataset name
3. Check that your content is published (not just saved as draft)
4. Ensure your blog posts have a `publishedAt` date that's not in the future
