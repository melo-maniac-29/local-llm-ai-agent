"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/dashboard/Sidebar';

export default function TroubleshootingPage() {
  const [status, setStatus] = useState<string>("Not tested yet");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{endpoint: string, status: string}[]>([]);

  const testEndpoints = async () => {
    setIsLoading(true);
    setStatus("Testing connections...");
    
    const endpoints = [
      "http://localhost:1234/v1/chat/completions",
      "http://127.0.0.1:1234/v1/chat/completions", 
      "http://192.168.117.23:1234/v1/chat/completions"
    ];
    
    const newResults = [];
    let anySuccess = false;
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: "user", content: "Hello" }
            ],
            model: "mistral-7b-instruct-v0.3:2",
            temperature: 0.7,
            max_tokens: 5,
            stream: false,
          }),
        });
        
        if (response.ok) {
          newResults.push({ endpoint, status: "SUCCESS ✅" });
          anySuccess = true;
        } else {
          const text = await response.text();
          newResults.push({ endpoint, status: `FAILED (${response.status}): ${text}` });
        }
      } catch (error) {
        newResults.push({ 
          endpoint, 
          status: `ERROR: ${error instanceof Error ? error.message : String(error)}` 
        });
      }
    }
    
    setResults(newResults);
    setStatus(anySuccess ? "At least one endpoint is working! ✅" : "All endpoints failed ❌");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1">
        <header className="bg-white shadow border-b">
          <div className="mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">LM Studio Troubleshooting</h1>
          </div>
        </header>
        <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">LM Studio Connection Tester</h2>
            <p className="mb-4">This tool will help you diagnose connection issues with your LLM Studio server.</p>
            
            <Button 
              onClick={testEndpoints} 
              disabled={isLoading}
              className="mb-4"
            >
              {isLoading ? "Testing..." : "Test Connections"}
            </Button>
            
            <div className="my-4 p-3 bg-slate-100 rounded">
              <p className="font-semibold">Status: {status}</p>
            </div>
            
            {results.length > 0 && (
              <div className="border rounded overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-200">
                    <tr>
                      <th className="p-2 text-left">Endpoint</th>
                      <th className="p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2 font-mono text-sm">{result.endpoint}</td>
                        <td className={`p-2 ${result.status.includes("SUCCESS") ? "text-green-600" : "text-red-600"}`}>
                          {result.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="mt-6 border-t pt-4">
              <h3 className="font-semibold mb-2">Troubleshooting Steps:</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Make sure LM Studio is running</li>
                <li>In LM Studio, go to Local Server tab and check the server address</li>
                <li>Make sure "Start server" button is clicked</li>
                <li>Check if any firewall is blocking the connection</li>
                <li>Try using localhost (127.0.0.1) instead of your network IP</li>
                <li>Make sure the model is properly loaded in LM Studio</li>
              </ol>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
