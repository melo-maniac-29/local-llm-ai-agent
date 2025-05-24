"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@/hooks/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  
  // Query for user's conversations
  const conversations = useQuery(
    api.messages.getConversations, 
    user ? { userId: user.id } : "skip"
  );

  // Mutation to delete a conversation
  const deleteConversation = useMutation(api.messages.deleteConversation);

  // Handle delete conversation
  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm("Are you sure you want to delete this conversation?")) {
      await deleteConversation({ 
        conversationId: conversationId, 
        userId: user?.id as string 
      });
      
      // If the deleted conversation is the current one, redirect to chat index
      if (conversationId === currentConversationId) {
        router.push('/dashboard/chat');
      }
    }
  };

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
                    "p-3 rounded hover:bg-slate-800 cursor-pointer text-sm truncate group",
                    currentConversationId === conv._id ? "bg-slate-700" : ""
                  )}
                  onClick={closeSidebar}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-grow overflow-hidden">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <span className="overflow-hidden text-ellipsis">{conv.title}</span>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteConversation(e, conv._id)}
                      className="text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                      aria-label="Delete conversation"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
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
