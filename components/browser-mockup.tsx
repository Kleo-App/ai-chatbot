'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MessageSquare, History, Search, MoreHorizontal, Settings, ChevronLeft, ChevronRight, RotateCcw, Plus } from 'lucide-react';
import { GuestMultimodalInput } from '@/components/guest-multimodal-input';
import { Button } from '@/components/ui/button';

interface BrowserMockupProps {
  onTriggerAuth: () => void;
}

export function BrowserMockup({ onTriggerAuth }: BrowserMockupProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
      {/* Browser Chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 border-b border-gray-200">
        {/* Traffic lights */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex items-center gap-1 ml-4">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Address bar */}
        <div className="flex-1 mx-4">
          <div className="bg-white rounded-lg px-4 py-2 text-sm text-gray-600 border border-gray-300">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              https://kleo.so
            </div>
          </div>
        </div>

        {/* Browser controls */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* App Content */}
      <div className="flex h-[500px] bg-white">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-50 border-r border-gray-200 transition-all duration-200 flex flex-col`}>
          {/* Sidebar Header */}
          <div className="h-12 flex items-center px-4 border-b border-gray-200">
            {sidebarOpen ? (
              <Image
                src="/images/kleo.svg"
                alt="Kleo"
                width={80}
                height={24}
                className="h-6 w-auto"
              />
            ) : (
              <Image
                src="/images/kleo-white.svg"
                alt="Kleo"
                width={24}
                height={24}
                className="h-6 w-6"
              />
            )}
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 p-4 space-y-4">
            {/* New Chat Button */}
            <Button 
              onClick={onTriggerAuth}
              className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {sidebarOpen && "New Chat"}
            </Button>

            {/* Navigation Items */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 cursor-pointer">
                <History className="w-4 h-4 text-gray-600" />
                {sidebarOpen && <span className="text-sm text-gray-700">History</span>}
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 cursor-pointer">
                <Search className="w-4 h-4 text-gray-600" />
                {sidebarOpen && <span className="text-sm text-gray-700">Search</span>}
              </div>
            </div>

            {/* Recent Chats */}
            {sidebarOpen && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recent</h3>
                <div className="space-y-1">
                  {[
                    "LinkedIn post about AI trends",
                    "Content calendar for Q1", 
                    "Personal branding strategy",
                    "Product launch announcement"
                  ].map((title, index) => (
                    <div 
                      key={index}
                      onClick={onTriggerAuth}
                      className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg cursor-pointer truncate"
                    >
                      {title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 cursor-pointer">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                G
              </div>
              {sidebarOpen && <span className="text-sm text-gray-700">Guest User</span>}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="h-12 flex items-center justify-between px-6 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <div className="w-4 h-4 flex flex-col justify-center space-y-1">
                  <div className="w-4 h-0.5 bg-gray-600"></div>
                  <div className="w-4 h-0.5 bg-gray-600"></div>
                  <div className="w-4 h-0.5 bg-gray-600"></div>
                </div>
              </Button>
              <h1 className="text-sm font-medium text-gray-900">New Chat</h1>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
            <div className="max-w-2xl w-full text-center space-y-6">
              {/* Kleo Logo */}
              <div className="mb-8">
                <Image
                  src="/images/kleo.svg"
                  alt="Kleo"
                  width={107}
                  height={32}
                  className="h-8 w-auto mx-auto opacity-60"
                />
              </div>

              {/* Welcome Message */}
              <div className="space-y-4">
                <h2 className="text-2xl font-medium text-gray-900">
                  What would you like to create today?
                </h2>
                <p className="text-gray-600">
                  I can help you write engaging LinkedIn posts, create content calendars, and develop your personal brand.
                </p>
              </div>

              {/* Example Prompts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
                {[
                  "Write a LinkedIn post about AI productivity",
                  "Create a content calendar for this month",
                  "Help me with personal branding strategy", 
                  "Draft a product announcement post"
                ].map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="text-left justify-start h-auto p-4 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={onTriggerAuth}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="max-w-3xl mx-auto">
              <GuestMultimodalInput 
                onTriggerAuth={onTriggerAuth}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 