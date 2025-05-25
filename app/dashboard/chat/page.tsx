"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@/hooks/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import ChatSidebar from '@/components/dashboard/ChatSidebar';
import DebugButton from './debug-button';
import { useGoogleCalendar } from '@/hooks/calendar';
import { formatStudyScheduleForCalendar } from '@/lib/langchain/calendar-client';
import { SchedulePreview } from '@/components/calendar/SchedulePreview';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sentiment?: string;
  actions?: string[];
  schedule?: any; // For storing schedule data
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
  
  // Query for existing conversation
  const latestConversation = useQuery(api.messages.getLatestConversation, 
    user ? { userId: user.id } : "skip"
  );
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save the entire conversation - defined with useCallback to avoid recreation
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
      
      // Generate a title from the first user message if possible
      const userMessage = messagesToSave.find(m => m.role === 'user');
      const title = userMessage 
        ? userMessage.content.slice(0, 30) + "..." 
        : "New conversation";
      
      console.log(`Saving conversation with ${messagesToSave.length} messages`);
      
      // Save conversation
      const result = await saveConversation({
        userId: user.id,
        title,
        messages: JSON.stringify(messagesToSave),
        ...(conversationId ? { conversationId } : {})
      });
      
      // Update conversationId if this is a new conversation
      if (result?.conversationId && !conversationId) {
        setConversationId(result.conversationId);
      }
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
  }, [user, messages, conversationId, saveConversation]);

  // Load saved conversation on initial render
  useEffect(() => {
    if (latestConversation && user) {
      try {
        // Set the conversation ID
        if (latestConversation._id) {
          setConversationId(latestConversation._id);
        }
        
        // Parse the messages from the JSON string
        if (latestConversation && latestConversation.messages) {
          const parsedMessages = JSON.parse(latestConversation.messages);
          
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
      }
    }
  }, [latestConversation, user]);

  // Enhanced scroll to bottom when messages update
  useEffect(() => {
    // Add a small timeout to ensure the DOM has updated
    const scrollTimeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    
    return () => clearTimeout(scrollTimeout);
  }, [messages]);  // State for scheduling-related UI
  const [showCalendarButtons, setShowCalendarButtons] = useState(false);
  const [scheduleData, setScheduleData] = useState<any>(null);
  
  // Use our calendar hook
  const { 
    isConnected: isCalendarConnected, 
    authUrl: googleAuthUrl, 
    getAuthUrl,
    addToCalendar,
    isLoading: isCalendarLoading 
  } = useGoogleCalendar();
    // Check for calendar connection params in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const calendarConnected = searchParams.get('calendar_connected');
    const calendarError = searchParams.get('calendar_error');
    const reason = searchParams.get('reason');
    
    console.log('[Calendar Integration] URL params check:', { 
      calendarConnected, 
      calendarError, 
      reason, 
      hasScheduleData: !!scheduleData 
    });
    
    if (calendarConnected === 'true') {
      console.log('[Calendar Integration] Successfully connected, schedule data:', scheduleData);
      
      // If we have schedule data, try to add it to the calendar
      if (scheduleData) {
        console.log('[Calendar Integration] Adding schedule to calendar after connection');
        handleAddToCalendar();
      } else {
        console.log('[Calendar Integration] No schedule data available after connection');
        setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          role: 'assistant',
          content: '✅ Google Calendar connected successfully! Now I can add events to your calendar.',
          timestamp: new Date(),
        }]);
      }
      // Remove params from URL
      window.history.replaceState({}, '', '/dashboard/chat');
    } else if (calendarError === 'true') {
      let errorMessage = '❌ There was an error connecting to Google Calendar. Please try again.';
      
      if (reason) {
        switch (reason) {
          case 'no_code':
            errorMessage = '❌ No authorization code was provided by Google. Please try again.';
            break;
          case 'no_user':
            errorMessage = '❌ User ID was not provided. Please try again.';
            break;
          case 'no_credentials':
            errorMessage = '❌ Google API credentials are not configured. Please contact support.';
            break;
          case 'no_convex':
            errorMessage = '❌ Database URL is not configured. Please contact support.';
            break;
        }
      }
      
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
      }]);
      // Remove params from URL
      window.history.replaceState({}, '', '/dashboard/chat');
    }
  }, [scheduleData]);
    // Handle adding schedule to calendar
  const handleAddToCalendar = useCallback(async () => {
    console.log('[Calendar Integration] handleAddToCalendar called with:', { 
      hasScheduleData: !!scheduleData, 
      hasUser: !!user, 
      isCalendarConnected 
    });
    
    if (!scheduleData || !user) {
      console.error('[Calendar Integration] Missing required data:', { 
        scheduleData: !!scheduleData, 
        user: !!user 
      });
      return;
    }
    
    try {
      // Format the schedule data for Google Calendar
      console.log('[Calendar Integration] Formatting schedule data:', scheduleData);
      const events = formatStudyScheduleForCalendar(scheduleData);
      console.log('[Calendar Integration] Formatted events:', events.length, 'events generated');
      
      // If already connected, add events directly
      if (isCalendarConnected) {
        console.log('[Calendar Integration] Calendar already connected, adding events directly');
        const result = await addToCalendar(events);
        console.log('[Calendar Integration] Add to calendar result:', result);
        
        if (result.success) {
          console.log('[Calendar Integration] Successfully added events to calendar');
          setMessages(prev => [...prev, {
            id: `system-${Date.now()}`,
            role: 'assistant',
            content: '✅ Study schedule has been added to your Google Calendar!',
            timestamp: new Date(),
          }]);
        } else {
          console.error('[Calendar Integration] Failed to add events:', result.error);
          throw new Error(result.error);
        }
      } else {
        // Need to connect first - get the auth URL
        console.log('[Calendar Integration] Not connected to calendar yet, getting auth URL');
        await getAuthUrl();
        console.log('[Calendar Integration] Auth URL obtained:', !!googleAuthUrl);
      }
    } catch (error) {
      console.error('[Calendar Integration] Error adding events to calendar:', error);
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        role: 'assistant',
        content: `❌ Error adding schedule to calendar: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      }]);
    } finally {
      console.log('[Calendar Integration] Cleaning up UI state');
      setShowCalendarButtons(false);
      setScheduleData(null);
    }
  }, [scheduleData, user, isCalendarConnected, addToCalendar, getAuthUrl]);
  
  // Auth redirect
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth');
    }
  }, [user, isLoading, router]);

  // Stream LLM call - defined with useCallback
  const callLLMWithStreaming = useCallback(async (userMessage: string, history: any[], currentMsgs: Message[]) => {
    try {
      // Create a snapshot of the current messages so we don't lose track of the user message
      const messagesSnapshot = [...currentMsgs];
      
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
      
      // Add streaming message to the messages that already include the user's message
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
          if (data === "[DONE]") continue;            try {
            const parsed = JSON.parse(data);
            
            // Check if this is a scheduling request that needs to be handled differently
            if (parsed.useNonStreaming) {
              // For scheduling requests, we need to call the non-streaming endpoint
              const nonStreamingResponse = await fetch('/api/llm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message: userMessage,
                  conversationHistory: validHistory
                }),
              });
              
              if (!nonStreamingResponse.ok) {
                throw new Error(`API error: ${nonStreamingResponse.status}`);
              }
              
              const responseData = await nonStreamingResponse.json();
              accumulatedContent = responseData.text;                // Check if this is a scheduling request
              if (responseData.isSchedulingRequest) {
                console.log('[Calendar Integration] Detected scheduling request in API response');
                
                // Try to get schedule data directly from API response first
                if (responseData.scheduleData) {
                  console.log("[Calendar Integration] Found schedule data in API response:", responseData.scheduleData);
                  console.log("[Calendar Integration] Schedule subjects:", responseData.scheduleData.schedule?.length || 'none');
                  
                  // Store the schedule data from API
                  setScheduleData(responseData.scheduleData);
                  
                  // Show calendar options
                  setShowCalendarButtons(true);
                  console.log("[Calendar Integration] Showing calendar buttons");
                  
                  // Make sure we have the Google auth URL
                  console.log("[Calendar Integration] Getting Google auth URL");
                  await getAuthUrl();
                }
                // Fallback to extracting from text if not in API response
                else {
                  console.log('[Calendar Integration] No direct schedule data, trying to extract from text');
                  try {
                    // Look for JSON-like content in the response
                    const jsonMatch = accumulatedContent.match(/```json\s*({[\s\S]*?})\s*```/);
                    if (jsonMatch && jsonMatch[1]) {
                      const extractedJson = jsonMatch[1];
                      console.log('[Calendar Integration] Found JSON data in text:', extractedJson.substring(0, 100) + '...');
                      
                      const scheduleInfo = JSON.parse(extractedJson);
                      console.log('[Calendar Integration] Parsed schedule from text response');
                      
                      // Store the extracted schedule data
                      setScheduleData(scheduleInfo);
                      
                      // Show calendar options
                      setShowCalendarButtons(true);
                      console.log("[Calendar Integration] Showing calendar buttons");
                      
                      // Make sure we have the Google auth URL
                      console.log("[Calendar Integration] Getting Google auth URL");
                      await getAuthUrl();
                    } else {
                      console.error('[Calendar Integration] No JSON schedule data found in text response');
                    }
                  } catch (jsonError) {
                    console.error("[Calendar Integration] Error extracting schedule data:", jsonError);
                  }
                }
              }
              
              setMessages(prev => prev.map(msg => 
                msg.id === tempMsgId 
                  ? { ...msg, content: accumulatedContent } 
                  : msg
              ));
              
              // Break out of the streaming loop since we're handling this differently
              reader.cancel();
              break;
            }
            
            // Regular streaming content
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
        }      }
      
      const finalMessage = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: accumulatedContent,
        timestamp: new Date(),
      };
      
      // Important: Use a callback with prev to ensure we're working with the latest state
      setMessages(prev => {
        const updatedMessages = prev.map(msg => 
          msg.id === tempMsgId ? finalMessage : msg
        );
        return updatedMessages;
      });
      
      // Wait for state update to complete before saving
      setTimeout(async () => {
        // Get current messages after state update
        const allCurrentMessages = messagesSnapshot.filter(m => 
          m.id !== 'typing-indicator' && m.id !== tempMsgId
        ).concat(finalMessage);
        
        // Save all messages including the user's original message and the final response
        await saveEntireConversation(allCurrentMessages);
        
        setIsStreaming(false);
      }, 100);
      
      return finalMessage;
      
    } catch (error) {
      console.error("Error in streaming:", error);
      setIsStreaming(false);
      throw error;
    }
  }, [saveEntireConversation, getAuthUrl]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isProcessing) return;
    
    console.log("Sending message:", inputMessage);
    
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: inputMessage.trim(),
      timestamp: new Date(),
    };
    
    // First update: Add user message to UI
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input and set processing flag
    setInputMessage('');
    setIsProcessing(true);
    
    try {
      // Create a snapshot with the user message
      const updatedWithUserMsg = [...messages, userMessage];
      
      // Add typing indicator
      setMessages(prev => [...prev, {
        id: 'typing-indicator',
        role: 'assistant',
        content: '...',
        timestamp: new Date(),
      }]);

      // Debug - what messages we're saving
      console.log("User message being saved:", userMessage);
      console.log("Current message state:", updatedWithUserMsg);

      // Create conversation history
      const conversationHistory = updatedWithUserMsg
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }));
      
      // Pass the snapshot with user message to ensure it's included
      await callLLMWithStreaming(userMessage.content, conversationHistory, updatedWithUserMsg);
      
    } catch (error) {
      console.error("Error handling message send:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [inputMessage, isProcessing, messages, callLLMWithStreaming]);

  // Debugging: Log messages state on every render
  useEffect(() => {
    console.log("Current messages state:", messages);
  });

  // Debugging: Log conversationId on every render
  useEffect(() => {
    console.log("Current conversationId:", conversationId);
  });

  // Debugging: Log user state on every render
  useEffect(() => {
    console.log("Current user state:", user);
  });

  // Add state for managing the sidebar visibility on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Add a function to start a new chat session
  const startNewChat = useCallback(() => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m your AI assistant. How can I help you today?',
        timestamp: new Date(),
      }
    ]);
    setConversationId(null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <ChatSidebar 
        currentConversationId={conversationId} 
        startNewChat={startNewChat}
        isOpen={isSidebarOpen}
        closeSidebar={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white shadow border-b flex-shrink-0">
          <div className="mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button 
                className="md:hidden mr-4 text-gray-500"
                onClick={() => setIsSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Chat with AI Agent</h1>
            </div>
            
            <Button 
              variant="outline"
              onClick={startNewChat}
            >
              New Chat
            </Button>
          </div>
        </header>
        
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full overflow-hidden">
          {/* Chat messages container with fixed height and scrolling */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-container">
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
            ))}            {/* Calendar consent UI with schedule preview */}
            {showCalendarButtons && scheduleData && (
              <div className="flex flex-col p-4 mb-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-blue-900 mb-2">Study Schedule Preview</h3>
                  
                  {/* Schedule Preview Component */}
                  <div className="bg-white rounded-md p-3 border border-blue-100 mb-4">
                    <SchedulePreview 
                      scheduleData={scheduleData} 
                      events={formatStudyScheduleForCalendar(scheduleData)} 
                    />
                  </div>
                  
                  <p className="text-sm mb-3">Would you like to add this study schedule to your calendar?</p>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={async () => {
                      if (isCalendarConnected) {
                        // Already connected, directly add events
                        await handleAddToCalendar();
                      } else {
                        // Need to connect first
                        if (googleAuthUrl) {
                          window.location.href = googleAuthUrl;
                        } else {
                          // Try to get the auth URL
                          await getAuthUrl();
                          if (googleAuthUrl) {
                            window.location.href = googleAuthUrl;
                          } else {
                            setMessages(prev => [...prev, {
                              id: `system-${Date.now()}`,
                              role: 'assistant',
                              content: 'Sorry, I could not connect to Google Calendar. Please try again later.',
                              timestamp: new Date(),
                            }]);
                            setShowCalendarButtons(false);
                            setScheduleData(null);
                          }
                        }
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isCalendarLoading}
                  >
                    {isCalendarLoading 
                      ? 'Processing...' 
                      : isCalendarConnected 
                        ? 'Add to Calendar' 
                        : 'Connect Google Calendar'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setMessages(prev => [...prev, {
                        id: `system-${Date.now()}`,
                        role: 'assistant',
                        content: 'No problem. You can still copy this schedule and add it to your calendar manually if you wish.',
                        timestamp: new Date(),
                      }]);
                      setShowCalendarButtons(false);
                      setScheduleData(null);
                    }}
                    disabled={isCalendarLoading}
                  >
                    No thanks
                  </Button>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message input form - fixed at the bottom */}
          <div className="border-t p-4 bg-white flex-shrink-0">
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
                autoComplete="off"
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
        
        {/* Add debug button in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4">
            <DebugButton messages={messages} conversationId={conversationId} />
          </div>
        )}
      </div>
    </div>
  );
}
