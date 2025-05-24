"use client";

import { useRef, useEffect } from 'react';
// ...existing imports...

export default function ChatWindow({ messages, loading, ...props }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Scroll when messages change

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]"> {/* Adjust height as needed */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Your existing message rendering code */}
        {messages.map((message, index) => (
          // ...message rendering
        ))}
        
        {/* This empty div is our scroll target */}
        <div ref={messagesEndRef} />
        
        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center my-4">
            <div className="animate-pulse">Loading...</div>
          </div>
        )}
      </div>
      
      {/* Chat input form - fixed at bottom */}
      <div className="p-4 border-t bg-white">
        {/* Your message input form */}
      </div>
    </div>
  );
}
