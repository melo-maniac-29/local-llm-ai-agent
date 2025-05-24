"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useSignOut } from '@/hooks/auth';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/dashboard/Sidebar';
import Link from 'next/link';

export default function Dashboard() {
  const { user, isLoading } = useUser();
  const { signOut } = useSignOut();
  const router = useRouter();

  
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
    return null; // useEffect will redirect
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1">
        <header className="bg-white shadow border-b">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
            <Button 
              variant="outline" 
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="rounded-lg border-4 border-dashed border-gray-200 p-8">
              <h2 className="text-xl font-semibold mb-4 text-center">Welcome to your AI Assistant Dashboard</h2>
              <p className="text-center mb-8">Select a feature to get started or chat with your AI assistant</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <Link href="/dashboard/chat">
                  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 text-center cursor-pointer">
                    <h3 className="font-medium text-lg mb-2">Chat with AI Agent</h3>
                    <p className="text-gray-600">Ask questions or get assistance from your AI</p>
                  </div>
                </Link>
                
                <Link href="/dashboard/settings">
                  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 text-center cursor-pointer">
                    <h3 className="font-medium text-lg mb-2">Settings</h3>
                    <p className="text-gray-600">Configure your AI assistant preferences</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
