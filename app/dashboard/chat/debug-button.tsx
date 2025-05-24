"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface DebugButtonProps {
  messages: any[];
  conversationId: string | null;
}

export default function DebugButton({ messages, conversationId }: DebugButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        size="sm" 
        variant="outline"
        onClick={() => setIsVisible(!isVisible)}
      >
        Debug
      </Button>
      
      {isVisible && (
        <div className="absolute bottom-12 right-0 w-96 bg-white p-4 border rounded-lg shadow-lg overflow-auto max-h-[70vh]">
          <h3 className="font-bold mb-2">Debug Info</h3>
          <div className="mb-2">
            <strong>Conversation ID:</strong> {conversationId || 'None'}
          </div>
          <div className="mb-2">
            <strong>Message Count:</strong> {messages.length}
          </div>
          <div className="mb-4">
            <strong>Message Roles:</strong> {messages.map(m => m.role).join(', ')}
          </div>
          
          <h4 className="font-semibold mb-1">Messages:</h4>
          {messages.map((msg, i) => (
            <div key={msg.id || i} className="text-xs mb-3 border-b pb-2">
              <div><strong>ID:</strong> {msg.id || 'No ID'}</div>
              <div><strong>Role:</strong> {msg.role}</div>
              <div><strong>Content:</strong> {msg.content.substring(0, 50)}...</div>
              <div><strong>Time:</strong> {msg.timestamp?.toString() || 'No timestamp'}</div>
            </div>
          ))}
          
          <div className="mt-2 flex justify-end">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsVisible(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
