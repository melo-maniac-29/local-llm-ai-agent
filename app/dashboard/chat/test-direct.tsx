"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Sidebar from '@/components/dashboard/Sidebar';

export default function TestDirectLLM() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const callLLM = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Choose a consistent endpoint - you can change this if needed
      const endpoint = 'http://localhost:1234/v1/chat/completions';
      
      // Create a proper message that follows LM Studio's requirements
      const messages = [
        // Only user role, no system role
        { role: 'user', content: input }
      ];
      
      const result = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          model: 'mistral-7b-instruct-v0.3:2',
          temperature: 0.7,
          max_tokens: 500,
          stream: false,
        }),
      });
      
      if (!result.ok) {
        const errorText = await result.text();
        throw new Error(`LLM API error: ${result.status} - ${errorText}`);
      }
      
      const data = await result.json();
      setResponse(data.choices[0].message.content);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1">
        <header className="bg-white shadow border-b">
          <div className="mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Test LLM Connection</h1>
          </div>
        </header>
        
        <main className="mx-auto max-w-2xl py-6 sm:px-6 lg:px-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-6">Direct LLM Test</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Your Message</label>
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message here"
                className="w-full"
              />
            </div>
            
            <Button
              onClick={callLLM}
              disabled={isLoading || !input.trim()}
              className="mb-6"
            >
              {isLoading ? 'Sending...' : 'Send to LLM'}
            </Button>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded text-red-700">
                {error}
              </div>
            )}
            
            {response && (
              <div className="mt-4">
                <h2 className="font-medium mb-2">Response:</h2>
                <div className="p-4 bg-gray-50 rounded border whitespace-pre-wrap">
                  {response}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}