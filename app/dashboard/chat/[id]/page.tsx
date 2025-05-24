"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import ChatSidebar from '@/components/dashboard/ChatSidebar';
import { Id } from '@/convex/_generated/dataModel';
import DebugButton from '../debug-button';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sentiment?: string;
  actions?: string[];
  timestamp: Date;
};

export default function ChatConversation() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const { user, isLoading } = useUser();
  
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const currentStreamingMessage = useRef("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Use mutation for saving complete conversations
  const saveConversation = useMutation(api.messages.saveConversation);
  
  // Query for the specific conversation
  const conversation = useQuery(
    api.messages.getConversation,
    { conversationId: conversationId as Id<"conversations"> }
  );
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load the specific conversation
  useEffect(() => {
    if (conversation && user) {
      try {
        if (conversation.userId !== user.id) {
          // This conversation doesn't belong to this user
          router.push('/dashboard/chat');
          return;
        }
        
        // Parse the messages from the JSON string
        if (conversation.messages) {
          const parsedMessages = JSON.parse(conversation.messages);
          
          if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
            const formattedMessages = parsedMessages.map((msg, index) => ({
              id: msg.id || `loaded-${index}`,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              sentiment: msg.sentiment,
              actions: msg.actions,
              timestamp: new Date(msg.timestamp),
            }));
            
            setMessages(formattedMessages);
          }
        }
      } catch (error) {
        console.error("Error parsing conversation:", error);
        router.push('/dashboard/chat');
      }
    }
  }, [conversation, user, router]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auth redirect
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth');
    }
  }, [user, isLoading, router]);

  // Start a new chat
  const startNewChat = useCallback(() => {
    router.push('/dashboard/chat');
  }, [router]);

  // Add the missing handleSendMessage method that wasn't implemented
  const saveEntireConversation = useCallback(async (messagesToSaveOverride?: Message[]) => {
    if (!user) return;
    
    try {
      // Use provided messages or current state
      const msgsToSave = messagesToSaveOverride || messages;
      
      // Don't save if we only have the welcome message
      if (msgsToSave.length <= 1) return;
      
      // Filter out typing indicators
      const messagesToSave = msgsToSave
        .filter(msg => msg.id !== 'typing-indicator')
        .map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString(),
          ...(msg.sentiment ? { sentiment: msg.sentiment } : {}),
          ...(msg.actions ? { actions: msg.actions } : {})
        }));
      
      // Update existing conversation
      await saveConversation({
        userId: user.id,
        title: conversation?.title || "Conversation",
        messages: JSON.stringify(messagesToSave),
        conversationId: conversationId
      });
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
  }, [user, messages, conversationId, saveConversation, conversation?.title]);

  const callLLMWithStreaming = useCallback(async (userMessage: string, history: any[], currentMsgs: Message[]) => {
    // Copy implementation from the main chat page
    // ...same implementation as in page.tsx...
    
    try {
      // Create a snapshot of the current messages
      const messagesSnapshot = [...currentMsgs];
      
      // ...rest of the implementation...
    } catch (error) {
      console.error("Error in streaming:", error);
      setIsStreaming(false);
      throw error;
    }
  }, [saveEntireConversation]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isProcessing) return;
    
    // Copy implementation from the main chat page
    // ...same implementation as in page.tsx...
    
    console.log("Sending message:", inputMessage);
    
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: inputMessage.trim(),
      timestamp: new Date(),
    };
    
    // ...rest of the implementation...
  }, [inputMessage, isProcessing, messages, callLLMWithStreaming]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <ChatSidebar 
        currentConversationId={conversationId}
        startNewChat={startNewChat}
        isOpen={isSidebarOpen}
        closeSidebar={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow border-b">
          <div className="mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex items-center">
              <button 
                className="md:hidden mr-4 text-gray-500"
                onClick={() => setIsSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                {conversation?.title || "Chat"}
              </h1>
            </div>
            
            <Button 
              variant="outline"
              onClick={startNewChat}
            >
              New Chat
            </Button>
          </div>
        </header>
        
        <div className="flex-1 flex flex-col p-4 max-w-4xl mx-auto w-full">
          {/* Same messages display as in the main chat page */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 chat-container">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200'
                }`}>
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  
                  {/* Debug code to show message ID in development */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs opacity-50">id: {msg.id.substring(0, 8)}</div>
                  )}
                  
                  {/* ...rest of the message rendering... */}
                  
                  <div className={`text-xs mt-1 ${
                    msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message input form - Same as in the main chat page */}
          <div className="border-t pt-4">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={isProcessing}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={!inputMessage.trim() || isProcessing}
              >
                Send
              </Button>
            </form>
            {isProcessing && (
              <div className="text-sm text-gray-500 mt-2">
                Processing your message...
              </div>
            )}
          </div>
        </div>
        
        {/* Debug button */}
        {process.env.NODE_ENV === 'development' && (
          <DebugButton messages={messages} conversationId={conversationId} />
        )}
      </div>
    </div>
  );
}
