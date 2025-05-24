"use client";

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@/hooks/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ChatSidebarProps {
  currentConversationId: string | null;
  startNewChat: () => void;
  isOpen: boolean;
  closeSidebar: () => void;
}

export default function ChatSidebar({ 
  currentConversationId, 
  startNewChat,
  isOpen,
  closeSidebar
}: ChatSidebarProps) {
  const { user } = useUser();
  
  // Query for user's conversations
  const conversations = useQuery(
    api.messages.getConversations, 
    user ? { userId: user.id } : "skip"
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}
    
      <div className={cn(
        "bg-slate-900 text-white md:w-64 min-h-screen p-4 flex flex-col",
        "fixed inset-y-0 left-0 z-50 md:relative transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-bold">Orbital AI</div>
          {/* Close button for mobile */}
          <button 
            onClick={closeSidebar}
            className="text-white md:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <Button 
          onClick={() => {
            startNewChat();
            closeSidebar();
          }}
          className="mb-6 w-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </Button>
        
        <div className="flex-grow overflow-y-auto space-y-2 mb-6">
          <div className="text-sm font-medium text-gray-400 mb-2">Recent chats</div>
          {conversations && conversations.length > 0 ? (
            conversations.map((conv) => (
              <Link key={conv._id} href={`/dashboard/chat/${conv._id}`}>
                <div 
                  className={cn(
                    "p-3 rounded hover:bg-slate-800 cursor-pointer text-sm truncate",
                    currentConversationId === conv._id ? "bg-slate-700" : ""
                  )}
                  onClick={closeSidebar}
                >
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="overflow-hidden text-ellipsis">{conv.title}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 pl-7">
                    {new Date(conv.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-gray-400 text-sm text-center mt-6">
              No previous conversations
            </div>
          )}
        </div>
        
        <div className="pt-4 border-t border-slate-700 space-y-2">
          <Link href="/dashboard" className="flex items-center text-gray-300 hover:text-white p-2 rounded hover:bg-slate-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>
          
          {process.env.NODE_ENV === 'development' && (
            <Link href="/dashboard/chat/debug" className="flex items-center text-gray-300 hover:text-white p-2 rounded hover:bg-slate-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Debug
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
