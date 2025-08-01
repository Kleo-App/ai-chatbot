import { getBlogPosts, getCategories } from '@/lib/sanity/queries';
import { LoggedOutHeader } from '@/components/logged-out-header';
import { Footer } from '@/components/footer';
import { Background } from '@/components/background';
import Link from 'next/link';
import Image from 'next/image';
import { urlFor } from '@/lib/sanity/config';
import { formatDistanceToNow } from 'date-fns';
import { Clock, User } from 'lucide-react';

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([
    getBlogPosts(),
    getCategories()
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Background />
      <LoggedOutHeader showJoinWaitlist={false} />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Kleo Blog
          </h1>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="flex-1 px-8 pb-16">
        <div className="max-w-6xl mx-auto">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                No posts yet
              </h2>
              <p className="text-gray-600">
                We&apos;re working on some great content. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <article 
                  key={post._id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ease-out overflow-hidden group"
                >
                  <Link href={`/blog/${post.slug.current}`}>
                    {post.mainImage && (
                      <div className="aspect-video overflow-hidden">
                        <Image
                          src={urlFor(post.mainImage).width(600).height(400).url()}
                          alt={post.mainImage.alt || post.title}
                          width={600}
                          height={400}
                          className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    
                    <div className="p-6">
                      {/* Categories */}
                      {post.categories && post.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.categories.slice(0, 2).map((category) => (
                            <span
                              key={category.slug.current}
                              className="inline-block px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full"
                            >
                              {category.title}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Title */}
                      <h2 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      {post.excerpt && (
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}

                      {/* Meta info */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          {post.author && (
                            <div className="flex items-center gap-2">
                              <User className="size-4" />
                              <span>{post.author.name}</span>
                            </div>
                          )}
                          {post.readingTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="size-4" />
                              <span>{post.readingTime} min read</span>
                            </div>
                          )}
                        </div>
                        <time dateTime={post.publishedAt}>
                          {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
                        </time>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}