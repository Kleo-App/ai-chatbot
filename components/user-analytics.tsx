'use client';

import { useState, useEffect } from 'react';
import { BarChart3, MessageSquare, TrendingUp, RefreshCw, Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoaderIcon } from '@/components/icons';
import { toast } from '@/components/toast';
import { getAllUserMemories, deleteMemory } from '@/lib/mem0Utils';

interface MemoryData {
  id: string;
  text?: string;
  metadata?: {
    category?: string;
    timestamp?: string;
    source?: string;
    hook?: string;
    tone?: string;
    structure?: string;
    published?: boolean;
    interaction_type?: string;
    satisfaction_level?: string;
    [key: string]: any;
  };
}

interface UserAnalyticsProps {
  userId?: string;
}

export function UserAnalytics({ userId }: UserAnalyticsProps) {
  const [memories, setMemories] = useState<MemoryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<'all' | 'posts'>('all');

  const fetchMemories = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const userMemories = await getAllUserMemories(userId);
      
      // Filter for analytics data (post_analytics and conversation_analytics)
      const memoryData = userMemories.filter(memory => 
        memory.metadata?.category === 'post_analytics' || 
        memory.metadata?.category === 'conversation_analytics'
      );
      
      setMemories(memoryData);
    } catch (error) {
      console.error('Error fetching memories:', error);
      toast({
        type: 'error',
        description: 'Failed to load your memories',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!memoryId) return;
    
    setDeletingIds(prev => new Set(prev).add(memoryId));
    
    try {
      await deleteMemory(memoryId);
      setMemories(prev => prev.filter(m => m.id !== memoryId));
      toast({
        type: 'success',
        description: 'Memory deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting memory:', error);
      toast({
        type: 'error',
        description: 'Failed to delete memory. This feature may not be available yet.',
      });
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(memoryId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMemories();
    }
  }, [userId, fetchMemories]);

  const filteredMemories = memories.filter((item: MemoryData) => {
    if (activeFilter === 'posts') {
      return item.metadata?.category === 'post_analytics';
    }
    return true;
  });

  const postMemories = memories.filter((item: MemoryData) => item.metadata?.category === 'post_analytics');
  const conversationMemories = memories.filter((item: MemoryData) => item.metadata?.category === 'conversation_analytics');

  // Calculate insights
  const publishedPosts = postMemories.filter((item: MemoryData) => item.metadata?.published).length;
  const totalPosts = postMemories.length;
  const commonTone = postMemories.reduce((acc: Record<string, number>, post: MemoryData) => {
    const tone = post.metadata?.tone;
    if (tone) {
      acc[tone] = (acc[tone] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const mostUsedTone = Object.keys(commonTone).reduce((a, b) => 
    commonTone[a] > commonTone[b] ? a : b, 'professional'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Your Content Memories</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMemories}
          disabled={isLoading}
        >
          {isLoading ? (
            <LoaderIcon size={16} />
          ) : (
            <>
              <RefreshCw className="size-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Memory Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="size-5 text-blue-600" />
            <span className="font-medium">Posts</span>
          </div>
          <div className="text-2xl font-bold">{totalPosts}</div>
          <div className="text-sm text-muted-foreground">
            {publishedPosts} published to LinkedIn
          </div>
        </div>
        
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="size-5 text-green-600" />
            <span className="font-medium">Memories</span>
          </div>
          <div className="text-2xl font-bold">{memories.length}</div>
          <div className="text-sm text-muted-foreground">
            Total stored memories
          </div>
        </div>
      </div>

      {/* Insights */}
      {totalPosts > 0 && (
        <div className="p-4 border rounded-lg bg-blue-50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="size-5 text-blue-600" />
            <span className="font-medium">Your Style Insights</span>
          </div>
          <div className="text-sm">
            <p>Most used tone: <span className="font-medium capitalize">{mostUsedTone}</span></p>
            <p>Publishing rate: <span className="font-medium">{Math.round((publishedPosts / totalPosts) * 100)}%</span></p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeFilter === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          All ({memories.length})
        </button>
        <button
          onClick={() => setActiveFilter('posts')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeFilter === 'posts'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Posts ({postMemories.length})
        </button>
      </div>
      
      {/* Memory List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <LoaderIcon size={32} />
        </div>
      ) : filteredMemories.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredMemories.map((item: MemoryData, index: number) => (
            <div
              key={item.id || index}
              className="p-3 border rounded-lg space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm">{item.text || 'No content'}</p>
                  {item.metadata && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.metadata.category && (
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          item.metadata.category === 'post_analytics' 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'bg-green-50 text-green-700'
                        }`}>
                          {item.metadata.category === 'post_analytics' ? 'Post' : 'Memory'}
                        </span>
                      )}
                      {item.metadata.tone && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-50 text-purple-700 rounded-full">
                          {item.metadata.tone}
                        </span>
                      )}
                      {item.metadata.published && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-50 text-orange-700 rounded-full">
                          Published
                        </span>
                      )}
                      {item.metadata.timestamp && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-50 text-gray-600 rounded-full">
                          <Calendar className="size-3 mr-1" />
                          {new Date(item.metadata.timestamp).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteMemory(item.id)}
                  disabled={deletingIds.has(item.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  {deletingIds.has(item.id) ? (
                    <LoaderIcon size={16} />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 className="size-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">No memories yet</p>
          <p className="text-sm">Your content selections will appear here</p>
        </div>
      )}
    </div>
  );
} 