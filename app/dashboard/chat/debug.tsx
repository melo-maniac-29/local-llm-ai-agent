"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/auth';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Sidebar from '@/components/dashboard/Sidebar';
import { Button } from '@/components/ui/button';

export default function DebugChatPage() {
  const { user } = useUser();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  
  // Get all conversations
  const conversations = useQuery(
    api.messages.getConversations, 
    user ? { userId: user.id } : "skip"
  );
  
  // Get detailed conversation data
  const conversationData = useQuery(
    api.messages.getConversation,
    selectedConversation ? { conversationId: selectedConversation } : "skip"
  );
  
  const [parsedMessages, setParsedMessages] = useState<any[]>([]);
  
  useEffect(() => {
    if (conversationData?.messages) {
      try {
        setParsedMessages(JSON.parse(conversationData.messages));
      } catch (e) {
        console.error("Error parsing messages:", e);
        setParsedMessages([]);
      }
    }
  }, [conversationData]);

  if (!user) {
    return <div className="p-4">Please log in to access this page</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow border-b">
          <div className="mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Chat Debug</h1>
            <Button 
              onClick={() => window.location.reload()}
              size="sm"
              variant="outline"
            >
              Refresh Data
            </Button>
          </div>
        </header>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel - conversation list */}
          <div className="w-1/3 border-r overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Conversations</h2>
              {conversations && conversations.length > 0 ? (
                <div className="space-y-2">
                  {conversations.map(conv => (
                    <div 
                      key={conv._id} 
                      className={`p-3 border rounded cursor-pointer hover:bg-gray-100 ${
                        selectedConversation === conv._id ? 'bg-blue-100' : ''
                      }`}
                      onClick={() => setSelectedConversation(conv._id)}
                    >
                      <div className="font-medium">{conv.title}</div>
                      <div className="text-sm text-gray-500">
                        Updated: {new Date(conv.lastUpdated).toLocaleString()}
                      </div>
                      <div className="text-xs">ID: {String(conv._id).substring(0, 8)}...</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No conversations found</p>
              )}
            </div>
          </div>
          
          {/* Right panel - message detail */}
          <div className="w-2/3 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-2">
                {conversationData ? 'Conversation Details' : 'Select a conversation'}
              </h2>
              
              {conversationData && (
                <>
                  <div className="bg-white rounded border p-4 mb-4">
                    <div className="mb-2"><strong>ID:</strong> {String(conversationData._id)}</div>
                    <div className="mb-2"><strong>Title:</strong> {conversationData.title}</div>
                    <div className="mb-2"><strong>User ID:</strong> {conversationData.userId}</div>
                    <div className="mb-2">
                      <strong>Created:</strong> {new Date(conversationData.createdAt).toLocaleString()}
                    </div>
                    <div className="mb-2">
                      <strong>Updated:</strong> {new Date(conversationData.lastUpdated).toLocaleString()}
                    </div>
                    <div className="flex items-center justify-between">
                      <div><strong>Messages:</strong> {parsedMessages.length}</div>
                      <Button 
                        onClick={() => {
                          console.log(parsedMessages);
                          navigator.clipboard.writeText(JSON.stringify(parsedMessages, null, 2));
                          alert("Copied messages to clipboard");
                        }}
                        size="sm"
                        variant="outline"
                      >
                        Copy JSON
                      </Button>
                    </div>
                  </div>
                  
                  <h3 className="text-md font-semibold mb-2">Message Content</h3>
                  {parsedMessages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`mb-2 p-3 rounded ${
                        msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold">{msg.role}</span>
                        <span className="text-gray-500 text-sm">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="mt-1 whitespace-pre-wrap border-l-2 pl-2 border-gray-300">
                        {msg.content}
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-gray-500">
                        <span>{msg.id ? `ID: ${msg.id}` : 'No ID'}</span>
                        <span>Index: {idx}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
