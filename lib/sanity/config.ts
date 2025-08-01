import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-25',
  useCdn: process.env.NODE_ENV === 'production',
};

export const client = createClient(sanityConfig);

const builder = imageUrlBuilder(client);

export function urlFor(source: any) {
  return builder.image(source);
}

// Types for our blog schema
export interface BlogPost {
  _id: string;
  _createdAt: string;
  title: string;
  slug: {
    current: string;
  };
  author: {
    name: string;
    image?: {
      asset: {
        url: string;
      };
    };
  };
  mainImage?: {
    asset: {
      url: string;
    };
    alt?: string;
  };
  excerpt?: string;
  body: any[];
  publishedAt: string;
  categories?: Array<{
    title: string;
    slug: {
      current: string;
    };
  }>;
  readingTime?: number;
}

export interface Author {
  _id: string;
  name: string;
  slug: {
    current: string;
  };
  image?: {
    asset: {
      url: string;
    };
  };
  bio?: any[];
}

export interface Category {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  description?: string;
}