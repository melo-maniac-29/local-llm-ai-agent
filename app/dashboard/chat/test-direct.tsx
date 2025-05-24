"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TestDirectLLM() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const callLLM = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await fetch('http://localhost:1234/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: input }
          ],
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
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Test LLM Direct Connection</h1>
      
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
  );
}
