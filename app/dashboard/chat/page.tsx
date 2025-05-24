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
  const [isStreaming, setIsStreaming] = useState(false);
  const currentStreamingMessage = useRef("");
  
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
    return <div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  if (!user) {
    return null;
  }

  // Save the entire conversation
  const saveEntireConversation = async () => {
    if (!user || messages.length <= 1) return;
    
    try {
      // Filter out typing indicators
      const messagesToSave = messages
        .filter(msg => msg.id !== 'typing-indicator')
        .map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString(),
          ...(msg.sentiment ? { sentiment: msg.sentiment } : {}),
          ...(msg.actions ? { actions: msg.actions } : {})
        }));
      
      // Generate a title from the first few messages
      const title = messages[1]?.content.slice(0, 30) + "..." || "New conversation";
      
      // Save conversation
      const result = await saveConversation({
        userId: user.id,
        title,
        messages: JSON.stringify(messagesToSave),
        ...(conversationId ? { conversationId } : {})
      });
      
      // Update conversationId if this is a new conversation
      if (result && result.conversationId && !conversationId) {
        setConversationId(result.conversationId);
      }
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
  };

  const callLLMWithStreaming = async (userMessage: string, history: any[]) => {
    try {
      const validHistory = history
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .slice(-6);
    
      const response = await fetch('/api/llm/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: validHistory
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      setIsStreaming(true);
      currentStreamingMessage.current = "";
      
      const tempMsgId = `streaming-${Date.now()}`;
      
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== 'typing-indicator'),
        {
          id: tempMsgId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        }
      ]);
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";
      
      if (!reader) throw new Error("Response body is null");
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = decoder.decode(value);
        const lines = text.split("\n\n");
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;
          
          const data = trimmedLine.substring(6);
          if (data === "[DONE]") continue;
          
          try {
            const parsed = JSON.parse(data);
            
            if (parsed.content) {
              accumulatedContent += parsed.content;
              
              setMessages(prev => prev.map(msg => 
                msg.id === tempMsgId 
                  ? { ...msg, content: accumulatedContent } 
                  : msg
              ));
            }
          } catch (e) {
            console.error("Error parsing SSE data:", e);
          }
        }
      }
      
      const finalMessage = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: accumulatedContent,
        timestamp: new Date(),
      };
      
      setMessages(prev => prev.map(msg => 
        msg.id === tempMsgId ? finalMessage : msg
      ));
      
      // Save the conversation with the new message
      const messagesToSave = [
        ...messages.filter(m => m.id !== tempMsgId),
        finalMessage
      ].map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString()
      }));
      
      await saveConversation({
        userId: user.id,
        title: messages[1]?.content.slice(0, 30) + "..." || "New conversation",
        messages: JSON.stringify(messagesToSave),
        ...(conversationId ? { conversationId } : {})
      });
      
      setIsStreaming(false);
      return finalMessage;
    } catch (error) {
      console.error("Error in streaming:", error);
      setIsStreaming(false);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;
    
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: inputMessage.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);
    
    try {
      // Show typing indicator
      setMessages(prev => [...prev, {
        id: 'typing-indicator',
        role: 'assistant',
        content: '...',
        timestamp: new Date(),
      }]);

      // Create conversation history
      const conversationHistory = messages
        .filter(msg => msg.id !== 'typing-indicator')
        .slice(-5)
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }))
        .filter(msg => msg.role === 'user' || msg.role === 'assistant');
      
      // Add current message
      conversationHistory.push({
        role: 'user',
        content: userMessage.content,
      });

      // Use streaming response
      await callLLMWithStreaming(userMessage.content, conversationHistory);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== 'typing-indicator'));
      
      // Add error message
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: "Sorry, I couldn't connect to the local LLM. Make sure LM Studio is running with API enabled.",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
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
                  
                  {msg.sentiment && (
                    <div className={`text-xs mt-1 italic ${
                      msg.sentiment === 'positive' ? 'text-green-500' : 
                      msg.sentiment === 'negative' ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      Sentiment: {msg.sentiment}
                    </div>
                  )}
                  
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
