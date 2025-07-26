'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LinkedInHook {
  id: number;
  source: string;
  content: string;
}

interface LinkedInHookSelectorProps {
  hooks: LinkedInHook[];
  onHookSelect: (hook: LinkedInHook) => void;
  isReadonly?: boolean;
}

export function LinkedInHookSelector({
  hooks,
  onHookSelect,
  isReadonly = false,
}: {
  hooks: Array<{ id: number; source: string; content: string }>;
  onHookSelect: (hook: { id: number; source: string; content: string }) => void;
  isReadonly?: boolean;
}) {
  console.log('[linkedin-hook-selector.tsx] Rendering with hooks:', JSON.stringify(hooks)); // Check if hooks are valid
  if (!hooks || hooks.length === 0) {
    console.warn('LinkedInHookSelector: No hooks provided or empty hooks array');
  } else {
    console.log('LinkedInHookSelector: Valid hooks found, count:', hooks.length);
  }

  const [selectedHook, setSelectedHook] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleHookSelect = (id: number) => {
    setSelectedHook(id);
  };

  const handleConfirmSelection = async () => {
    if (!selectedHook) {
      toast.error("Please select a hook before proceeding");
      return;
    }
    
    setIsLoading(true);
    try {
      const hook = hooks.find(h => h.id === selectedHook);
      if (hook) {
        onHookSelect(hook);
      }
    } catch (error) {
      console.error('Error selecting hook:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeColor = (source: string): string => {
    switch (source) {
      case "Monetisable Expertise":
        return "bg-green-600";
      case "Strategic Arbitrage":
        return "bg-purple-600";
      case "Educational":
        return "bg-blue-600";
      case "Highly Engaging":
        return "bg-orange-600";
      default:
        return "bg-[#157DFF]";
    }
  };

  console.log('[linkedin-hook-selector.tsx] Selected hook:', selectedHook);
  console.log('[linkedin-hook-selector.tsx] Is readonly:', isReadonly);
  console.log('[linkedin-hook-selector.tsx] Hooks length:', hooks?.length);

  if (isReadonly) {
    // If readonly, just show the selected hook
    const hook = hooks.find(h => h.id === selectedHook) || hooks[0];
    return (
      <div className="w-full max-w-3xl my-4">
        <h3 className="text-lg font-medium mb-4">
          {isReadonly && selectedHook
            ? 'Selected Hook'
            : 'Select a hook for your LinkedIn post'}
        </h3>
        <p className="text-gray-600 text-sm">The hook is the first thing your audience will see and is the most important part of your post.</p>
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200">
          <CardContent className="p-4">
            <div className="mb-3">
              <Badge className={`${getBadgeColor(hook.source)} text-white text-xs`}>{hook.source}</Badge>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">{hook.content}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('[linkedin-hook-selector.tsx] About to render hooks grid')

  console.log('[linkedin-hook-selector.tsx] Rendering hook cards for', hooks.length, 'hooks');
  
  return (
    <div className="w-full max-w-5xl my-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-4">
          {isReadonly && selectedHook
            ? 'Selected Hook'
            : 'Select a hook for your LinkedIn post'}
        </h3>
        <p className="text-gray-600 text-sm">The hook is the first thing your audience will see and is the most important part of your post.</p>
      </div>
      
      {hooks.length === 0 ? (
        <div className="p-4 border rounded bg-yellow-50">
          <p className="text-amber-700">No hook options available. Please try again.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {hooks.map((hook) => {
            console.log('[linkedin-hook-selector.tsx] Rendering hook card:', hook.id);
            return (
              <Card
                key={hook.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                  selectedHook === hook.id
                    ? "bg-blue-50/80 backdrop-blur-sm border-[#157DFF]"
                    : "bg-white/80 backdrop-blur-sm border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleHookSelect(hook.id)}
              >
                <CardContent className="p-4">
                  <div className="mb-3">
                    <Badge className={`${getBadgeColor(hook.source)} text-white text-xs`}>{hook.source}</Badge>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{hook.content}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      <div className="flex justify-end">
        <Button
          onClick={handleConfirmSelection}
          className="bg-[#157DFF] hover:bg-blue-600 text-white px-6 py-2 rounded-full font-medium text-sm shadow hover:shadow-md transition-all duration-200"
          disabled={!selectedHook || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Selecting...
            </>
          ) : (
            'Use Selected Hook'
          )}
        </Button>
      </div>
    </div>
  );
}
