'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Copy, BookOpen, Lightbulb, Target, TrendingUp, Users, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  description: string;
}

const templates: Template[] = [
  // Attention-Grabbing Hooks
  {
    id: 'hook-1',
    title: 'Controversial Question Hook',
    content: 'Unpopular opinion: [Your controversial but thought-provoking statement]\n\nHere\'s why I believe this...',
    category: 'hooks',
    tags: ['engagement', 'debate'],
    description: 'Start conversations with a bold statement that challenges conventional thinking'
  },
  {
    id: 'hook-2',
    title: 'Problem/Solution Hook',
    content: 'I spent 3 years struggling with [problem].\n\nThen I discovered this simple solution that changed everything:\n\n👇',
    category: 'hooks',
    tags: ['storytelling', 'value'],
    description: 'Share your journey from problem to solution to inspire others'
  },
  {
    id: 'hook-3',
    title: 'Behind-the-Scenes Hook',
    content: 'What really happens behind closed doors at [your company/industry]:\n\n📈 The truth most people don\'t see...',
    category: 'hooks',
    tags: ['transparency', 'insider'],
    description: 'Give your audience exclusive insights into your world'
  },
  {
    id: 'hook-4',
    title: 'Mistake Admission Hook',
    content: 'I made a $[X] mistake last week.\n\nHere\'s what I learned (so you don\'t have to):',
    category: 'hooks',
    tags: ['vulnerability', 'lessons'],
    description: 'Build trust by sharing your failures and lessons learned'
  },

  // Complete Post Templates
  {
    id: 'template-1',
    title: 'Personal Story Framework',
    content: '🔸 The Challenge:\n[Describe the problem you faced]\n\n🔸 The Journey:\n[Share your process and struggles]\n\n🔸 The Breakthrough:\n[What changed everything]\n\n🔸 The Results:\n[Specific outcomes and impact]\n\n💡 Key Takeaway:\n[Main lesson for your audience]\n\nWhat\'s one challenge you\'re working through right now?',
    category: 'templates',
    tags: ['storytelling', 'engagement'],
    description: 'A proven structure for sharing personal experiences that resonate'
  },
  {
    id: 'template-2',
    title: 'Tips & Insights List',
    content: '[Number] [Topic] insights I wish I knew earlier:\n\n1️⃣ [First insight]\n→ [Brief explanation]\n\n2️⃣ [Second insight]\n→ [Brief explanation]\n\n3️⃣ [Third insight]\n→ [Brief explanation]\n\n4️⃣ [Fourth insight]\n→ [Brief explanation]\n\n5️⃣ [Fifth insight]\n→ [Brief explanation]\n\nWhich one resonates most with you?',
    category: 'templates',
    tags: ['education', 'value'],
    description: 'Share valuable insights in an easy-to-digest numbered format'
  },
  {
    id: 'template-3',
    title: 'Company/Project Announcement',
    content: '🚀 Excited to share: [Your announcement]\n\n💡 Why this matters:\n[Explain the significance and impact]\n\n🎯 What\'s next:\n[Future plans or call to action]\n\n👥 Special thanks:\n[Acknowledge team members or supporters]\n\nWhat would you like to know more about?',
    category: 'templates',
    tags: ['announcement', 'professional'],
    description: 'Professional template for sharing company news and achievements'
  },
  {
    id: 'template-4',
    title: 'Industry Analysis',
    content: 'The [Industry] landscape is changing rapidly.\n\nHere\'s what I\'m seeing:\n\n📈 [Trend 1]: [Brief explanation]\n📊 [Trend 2]: [Brief explanation]\n🔮 [Trend 3]: [Brief explanation]\n\nMy prediction for 2024:\n[Your forecast and reasoning]\n\nWhat trends are you noticing in your field?',
    category: 'templates',
    tags: ['analysis', 'trends'],
    description: 'Share your industry insights and predictions to establish thought leadership'
  },

  // Engagement Strategies
  {
    id: 'strategy-1',
    title: 'Question-Driven Engagement',
    content: 'End every post with a question that encourages responses:\n\n• "What\'s your experience with...?"\n• "How do you handle...?"\n• "What would you add to this list?"\n• "Which point resonates most?"\n• "What\'s your biggest challenge with...?"',
    category: 'strategies',
    tags: ['engagement', 'questions'],
    description: 'Proven question formats to boost comments and discussions'
  },
  {
    id: 'strategy-2',
    title: 'Call-to-Action Templates',
    content: 'Strong CTAs that drive action:\n\n🔔 "Follow for more [topic] insights"\n💬 "Share your thoughts in the comments"\n🔄 "Repost if you found this helpful"\n📢 "Tag someone who needs to see this"\n💌 "DM me for [specific offer/resource]"',
    category: 'strategies',
    tags: ['cta', 'growth'],
    description: 'Effective call-to-action phrases to increase engagement and followers'
  }
];

const categories = [
  { id: 'hooks', label: 'Hooks', icon: Target, description: 'Attention-grabbing opening lines' },
  { id: 'templates', label: 'Templates', icon: BookOpen, description: 'Complete post structures' },
  { id: 'strategies', label: 'Strategies', icon: TrendingUp, description: 'Engagement techniques' }
];

export default function LibraryPage() {
  const [activeCategory, setActiveCategory] = useState('hooks');

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  };

  const filteredTemplates = templates.filter(template => template.category === activeCategory);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Content Library</h1>
                <p className="text-muted-foreground">
                  Professional LinkedIn hooks, templates, and strategies to elevate your content
                </p>
              </div>
            </div>
          </div>

          {/* Categories */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id}>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">{category.label}</h2>
                  <p className="text-muted-foreground">{category.description}</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTemplates.map((template) => (
                    <Card key={template.id} className="h-full">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{template.title}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(template.content)}
                            className="shrink-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {template.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <pre className="text-sm whitespace-pre-wrap font-mono">
                            {template.content}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Tips Section */}
          <div className="mt-12 p-6 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Pro Tips for Using Templates</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Personalize templates with your unique voice and experiences</li>
                  <li>• Replace placeholder text with specific, relevant examples</li>
                  <li>• Test different hooks to see what resonates with your audience</li>
                  <li>• Combine elements from different templates to create something new</li>
                  <li>• Always end with a question or call-to-action to drive engagement</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}