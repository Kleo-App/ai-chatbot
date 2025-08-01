import { client } from './config';
import type { BlogPost } from './config';

// Query to get all published blog posts
export async function getBlogPosts(): Promise<BlogPost[]> {
  const query = `
    *[_type == "post"] | order(_createdAt desc) {
      _id,
      _createdAt,
      title,
      slug,
      author->{
        name,
        image
      },
      mainImage,
      excerpt,
      publishedAt,
      categories[]->{
        title,
        slug
      },
      readingTime
    }
  `;
  
  return await client.fetch(query);
}

// Query to get a single blog post by slug
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const query = `
    *[_type == "post" && slug.current == $slug][0] {
      _id,
      _createdAt,
      title,
      slug,
      author->{
        name,
        image,
        bio
      },
      mainImage,
      excerpt,
      body,
      publishedAt,
      categories[]->{
        title,
        slug
      },
      readingTime
    }
  `;
  
  return await client.fetch(query, { slug });
}

// Query to get related posts
export async function getRelatedPosts(currentPostId: string, categories: string[] = []): Promise<BlogPost[]> {
  const query = `
    *[_type == "post" && _id != $currentPostId] | order(_createdAt desc)[0...3] {
      _id,
      title,
      slug,
      mainImage,
      excerpt,
      publishedAt,
      readingTime
    }
  `;
  
  return await client.fetch(query, { currentPostId, categories });
}

// Query to get all categories
export async function getCategories() {
  const query = `
    *[_type == "category"] | order(title asc) {
      _id,
      title,
      slug,
      description
    }
  `;
  
  return await client.fetch(query);
}