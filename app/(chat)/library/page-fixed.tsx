'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, BookOpen, Lightbulb, Target, MessageCircle, ExternalLink, Loader2, Search, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { WritePostModal } from '@/components/write-post-modal';
import { ImageModal } from '@/components/image-modal';
import type { Hook } from '@/lib/db/schema-hooks';
import type { Post } from '@/lib/db/schema-posts';

interface ContentItem {
  id: string;
  title: string;
  template: string;
  image?: string | null;
  postUrl?: string | null;
}

interface ContentCardProps {
  item: ContentItem;
  onWritePost: (item: ContentItem, type: 'hook' | 'post') => void;
  onImageClick: (imageUrl: string, title: string) => void;
  type: 'hook' | 'post';
}

function ContentCard({ item, onWritePost, onImageClick, type }: ContentCardProps) {
  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  };

  return (
    <Card className="overflow-hidden">
      {/* Image Header */}
      {item.image && (
        <div 
          className="relative h-48 w-full overflow-hidden bg-muted/20 cursor-pointer group"
          onClick={() => onImageClick(item.image!, item.title)}
        >
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="size-full object-contain transition-transform group-hover:scale-105"
            onError={(e) => {
              // Hide image if it fails to load
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
              <svg className="size-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          </div>
        </div>
      )}

      <CardHeader className={item.image ? "pb-3" : ""}>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex-1 leading-tight">{item.title}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(item.template)}
            className="size-8 p-0 shrink-0"
          >
            <Copy className="size-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className={item.image ? "pt-0" : ""}>
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <pre className="text-sm whitespace-pre-wrap leading-relaxed">
            {item.template}
          </pre>
        </div>
        
        {item.postUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(item.postUrl!, '_blank')}
            className="w-full mb-3"
          >
            <ExternalLink className="size-4 mr-2" />
            View on LinkedIn
          </Button>
        )}
        
        <Button
          onClick={() => onWritePost(item, type)}
          className="w-full"
          size="sm"
        >
          <MessageCircle className="size-4 mr-2" />
          Write a Post Like This
        </Button>
      </CardContent>
    </Card>
  );
}

export default function LibraryPage() {
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [selectedType, setSelectedType] = useState<'hook' | 'post'>('hook');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('hooks');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hooksResponse, postsResponse] = await Promise.all([
          fetch('/api/hooks'),
          fetch('/api/posts')
        ]);

        if (!hooksResponse.ok) {
          throw new Error('Failed to fetch hooks');
        }
        if (!postsResponse.ok) {
          throw new Error('Failed to fetch posts');
        }

        const [hooksData, postsData] = await Promise.all([
          hooksResponse.json(),
          postsResponse.json()
        ]);

        setHooks(hooksData);
        setPosts(postsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleWritePost = (item: ContentItem, type: 'hook' | 'post') => {
    setSelectedItem(item);
    setSelectedType(type);
    setIsWriteModalOpen(true);
  };

  const handleImageClick = (imageUrl: string, title: string) => {
    setSelectedImage({ src: imageUrl, alt: title });
    setIsImageModalOpen(true);
  };

  // Filter content based on search query and active tab
  const filteredContent = useMemo(() => {
    const items = activeTab === 'hooks' ? hooks : posts;
    return items.filter(item => {
      return !searchQuery || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.template.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [hooks, posts, searchQuery, activeTab]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex items-center gap-2">
                <Loader2 className="size-6 animate-spin" />
                <span>Loading templates...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="size-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">LinkedIn Template Library</h1>
                <p className="text-muted-foreground">
                  Professional LinkedIn hooks and templates to elevate your content. Click &quot;Write a Post Like This&quot; to create content using any template.
                </p>
              </div>
            </div>

            {/* Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="hooks" className="flex items-center gap-2">
                  <Target className="size-4" />
                  Hooks ({hooks.length})
                </TabsTrigger>
                <TabsTrigger value="posts" className="flex items-center gap-2">
                  <FileText className="size-4" />
                  Posts ({posts.length})
                </TabsTrigger>
              </TabsList>

              {/* Search */}
              <div className="space-y-4 mb-8">
                {/* Search Bar */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search hooks and templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSearch}
                      className="absolute right-1 top-1/2 -translate-y-1/2 size-7 p-0"
                    >
                      <X className="size-3" />
                    </Button>
                  )}
                </div>

                {/* Results Count */}
                <div className="text-sm text-muted-foreground">
                  Showing {filteredContent.length} of {activeTab === 'hooks' ? hooks.length : posts.length} {activeTab}
                  {searchQuery && <span> (filtered)</span>}
                </div>
              </div>

              <TabsContent value="hooks">
                {hooks.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="size-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hooks available</h3>
                    <p className="text-muted-foreground">
                      Upload your hooks CSV file using the upload script to get started.
                    </p>
                  </div>
                ) : filteredContent.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="size-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hooks found</h3>
                    <p className="text-muted-foreground mb-4">
                      No hooks match your search criteria.
                    </p>
                    <Button onClick={clearSearch} variant="outline">
                      Clear search
                    </Button>
                  </div>
                ) : (
                  <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
                    {filteredContent.map((item) => (
                      <div key={item.id} className="mb-6 break-inside-avoid">
                        <ContentCard 
                          item={item} 
                          onWritePost={handleWritePost}
                          onImageClick={handleImageClick}
                          type="hook"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="posts">
                {posts.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="size-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No posts available</h3>
                    <p className="text-muted-foreground">
                      Upload your posts CSV file using the upload script to get started.
                    </p>
                  </div>
                ) : filteredContent.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="size-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                    <p className="text-muted-foreground mb-4">
                      No posts match your search criteria.
                    </p>
                    <Button onClick={clearSearch} variant="outline">
                      Clear search
                    </Button>
                  </div>
                ) : (
                  <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
                    {filteredContent.map((item) => (
                      <div key={item.id} className="mb-6 break-inside-avoid">
                        <ContentCard 
                          item={item} 
                          onWritePost={handleWritePost}
                          onImageClick={handleImageClick}
                          type="post"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Tips Section */}
          <div className="mt-12 p-6 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-start gap-3">
              <Lightbulb className="size-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Pro Tips for Using Templates</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Use the search bar to find templates by title or content</li>
                  <li>• Click &quot;Write a Post Like This&quot; to start a guided writing session</li>
                  <li>• Personalize templates with your unique voice and experiences</li>
                  <li>• Use the copy button to quickly grab templates for manual editing</li>
                  <li>• Click images to view them larger for better inspiration</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Write Post Modal */}
      <WritePostModal
        item={selectedItem}
        type={selectedType}
        isOpen={isWriteModalOpen}
        onClose={() => {
          setIsWriteModalOpen(false);
          setSelectedItem(null);
        }}
      />

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          src={selectedImage.src}
          alt={selectedImage.alt}
          isOpen={isImageModalOpen}
          onClose={() => {
            setIsImageModalOpen(false);
            setSelectedImage(null);
          }}
        />
      )}
    </div>
  );
} 