import { getBlogPost, getRelatedPosts, getBlogPosts } from '@/lib/sanity/queries';
import { LoggedOutHeader } from '@/components/logged-out-header';
import { Footer } from '@/components/footer';
import { Background } from '@/components/background';
import { PortableText } from '@portabletext/react';
import Link from 'next/link';
import Image from 'next/image';
import { urlFor } from '@/lib/sanity/config';
import { formatDistanceToNow, format } from 'date-fns';
import { Clock, User, ArrowLeft, Calendar } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

// Portable Text components for rich text rendering
const portableTextComponents = {
  types: {
    image: ({ value }: any) => (
      <div className="my-8">
        <Image
          src={urlFor(value).url()}
          alt={value.alt || ''}
          width={800}
          height={400}
          className="rounded-xl w-full h-auto"
        />
        {value.alt && (
          <p className="text-sm text-gray-600 text-center mt-2 italic">
            {value.alt}
          </p>
        )}
      </div>
    ),
  },
  block: {
    h1: ({ children }: any) => (
      <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{children}</h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-lg font-semibold text-gray-900 mt-6 mb-3">{children}</h4>
    ),
    normal: ({ children }: any) => (
      <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-600 pl-6 italic text-gray-700 my-6">
        {children}
      </blockquote>
    ),
  },
  marks: {
    link: ({ children, value }: any) => (
      <a
        href={value.href}
        className="text-blue-600 hover:text-blue-800 underline"
        target={value.href.startsWith('http') ? '_blank' : undefined}
        rel={value.href.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
    strong: ({ children }: any) => (
      <strong className="font-semibold">{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className="italic">{children}</em>
    ),
  },
  list: {
    bullet: ({ children }: any) => (
      <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>
    ),
  },
  listItem: {
    bullet: ({ children }: any) => (
      <li className="text-gray-700">{children}</li>
    ),
  },
};

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(
    post._id, 
    post.categories?.map(cat => cat.slug.current) || []
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Background />
      <LoggedOutHeader showJoinWaitlist={false} />
      
      {/* Back to Blog Button */}
      <div className="pt-24 px-8">
        <div className="max-w-4xl mx-auto">
          <Button asChild variant="ghost" className="mb-8 text-gray-600 hover:text-gray-900">
            <Link href="/blog" className="flex items-center gap-2">
              <ArrowLeft className="size-4" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>

      {/* Article Header */}
      <article className="flex-1 px-8 pb-16">
        <header className="max-w-4xl mx-auto mb-12">
          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.categories.map((category) => (
                <span
                  key={category.slug.current}
                  className="inline-block px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-full"
                >
                  {category.title}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8">
            {post.author && (
              <div className="flex items-center gap-3">
                {post.author.image && (
                  <Image
                    src={urlFor(post.author.image).width(40).height(40).url()}
                    alt={post.author.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                )}
                <div className="flex items-center gap-2">
                  <User className="size-4" />
                  <span className="font-medium">{post.author.name}</span>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Calendar className="size-4" />
              <time dateTime={post.publishedAt}>
                {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
              </time>
            </div>

            {post.readingTime && (
              <div className="flex items-center gap-2">
                <Clock className="size-4" />
                <span>{post.readingTime} min read</span>
              </div>
            )}
          </div>

          {/* Featured Image */}
          {post.mainImage && (
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <Image
                src={urlFor(post.mainImage).width(1200).height(600).url()}
                alt={post.mainImage.alt || post.title}
                width={1200}
                height={600}
                className="w-full h-auto"
                priority
              />
            </div>
          )}
        </header>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            <PortableText 
              value={post.body} 
              components={portableTextComponents}
            />
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="max-w-4xl mx-auto mt-16 pt-16 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <article 
                  key={relatedPost._id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <Link href={`/blog/${relatedPost.slug.current}`}>
                    {relatedPost.mainImage && (
                      <div className="aspect-video overflow-hidden">
                        <Image
                          src={urlFor(relatedPost.mainImage).width(400).height(250).url()}
                          alt={relatedPost.title}
                          width={400}
                          height={250}
                          className="size-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {relatedPost.title}
                      </h3>
                      {relatedPost.excerpt && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}
      </article>

      <Footer />
    </div>
  );
}

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  
  return posts.map((post) => ({
    slug: post.slug.current,
  }));
}