"use client";

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/hooks/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Sidebar from '@/components/dashboard/Sidebar';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sentiment?: string;
  actions?: string[];
  timestamp: Date;
};

export default function ChatWithAgent() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. How can I help you today?',
      timestamp: new Date(),
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Use mutation for saving complete conversations
  const saveConversation = useMutation(api.messages.saveConversation);
  
  // Optional: Track the current conversation ID
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  // Query for existing messages
  const savedMessages = useQuery(api.messages.getMessages, 
    user ? { userId: user.id } : "skip"
  );
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load saved messages on initial render
  useEffect(() => {
    if (savedMessages && savedMessages.length > 0) {
      const formattedMessages = savedMessages.map(msg => ({
        id: msg._id.toString(),
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.timestamp),
      }));
      
      // Only set if we have saved messages
      if (formattedMessages.length > 0) {
        setMessages(formattedMessages);
      }
    }
  }, [savedMessages]);

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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const callLLMDirectly = async (userMessage: string, conversationHistory: any[]) => {
    console.log("Calling backend API route");
    
    try {
      // Format conversation history correctly - include only recent messages
      // and ensure they only have user or assistant roles
      const validHistory = conversationHistory
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .slice(-6); // Keep conversation context manageable
    
      // Call the local API route
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: validHistory
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error("LLM API error:", errorData);
        throw new Error(`API error: ${response.status} - ${errorData}`);
      }
      
      const data = await response.json();
      return {
        text: data.text,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error in callLLMDirectly:", error);
      throw error;
    }
  };

  // Save the entire conversation
  const saveEntireConversation = async () => {
    if (!user || messages.length <= 1) return; // Don't save empty conversations
    
    try {
      // Filter out typing indicators
      const messagesToSave = messages
        .filter(msg => msg.id !== 'typing-indicator')
        .map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString(),
          // Include optional fields if they exist
          ...(msg.sentiment ? { sentiment: msg.sentiment } : {}),
          ...(msg.actions ? { actions: msg.actions } : {}),
        }));
      
      // Generate a title from the first few messages
      const title = messages[1]?.content.slice(0, 30) + "..." || "New conversation";
      
      // Save conversation
      const result = await saveConversation({
        userId: user.id,
        title,
        messages: JSON.stringify(messagesToSave),
        ...(conversationId ? { conversationId } : {}),
      });
      
      // Update conversationId if this is a new conversation
      if (result.conversationId && !conversationId) {
        setConversationId(result.conversationId);
      }
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;
    
    // Add user message to the chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);
    
    try {
      // Save user message to database
      // await saveMessage({ 
      //   userId: user.id,
      //   role: 'user',
      //   content: userMessage.content,
      //   timestamp: userMessage.timestamp.toISOString()
      // });
      
      // Show typing indicator
      setMessages(prev => [...prev, {
        id: 'typing-indicator',
        role: 'assistant',
        content: '...',
        timestamp: new Date(),
      }]);

      // Create conversation history for context
      const conversationHistory = messages
        .filter(msg => msg.id !== 'typing-indicator') // Skip typing indicators
        .slice(-5) // Only use last 5 messages for context window limits
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }))
        // Ensure only 'user' and 'assistant' roles
        .filter(msg => msg.role === 'user' || msg.role === 'assistant');
      
      // Add current user message
      conversationHistory.push({
        role: 'user',
        content: userMessage.content,
      });

      // Call LLM directly instead of using Convex action
      const response = await callLLMDirectly(
        userMessage.content, 
        conversationHistory
      );
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== 'typing-indicator'));
      
      // Add assistant message to the chat
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response?.text || "I'm sorry, I couldn't process that request.",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Save assistant response to database
      // await saveMessage({
      //   userId: user.id,
      //   role: 'assistant',
      //   content: assistantMessage.content,
      //   timestamp: assistantMessage.timestamp.toISOString()
      // });
      
      // Save the entire conversation after adding new messages
      saveEntireConversation();
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== 'typing-indicator'));
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I couldn't connect to the local LLM. Make sure LM Studio is running with API enabled.",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      // Save error response to database
      // await saveMessage({
      //   userId: user.id,
      //   role: 'assistant',
      //   content: errorMessage.content,
      //   timestamp: errorMessage.timestamp.toISOString()
      // });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow border-b">
          <div className="mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Chat with AI Agent</h1>
          </div>
        </header>
        <div className="flex-1 flex flex-col p-4 max-w-4xl mx-auto w-full">
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
                  
                  {/* Show sentiment if available */}
                  {msg.sentiment && (
                    <div className={`text-xs mt-1 italic ${
                      msg.sentiment === 'positive' ? 'text-green-500' : 
                      msg.sentiment === 'negative' ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      Sentiment: {msg.sentiment}
                    </div>
                  )}
                  
                  {/* Show suggested actions if available */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-gray-600">Suggested actions:</p>
                      <ul className="list-disc list-inside text-xs text-gray-600">
                        {msg.actions.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
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
      </div>
    </div>
  );
}
