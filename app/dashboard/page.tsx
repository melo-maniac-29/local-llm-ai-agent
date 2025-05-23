"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useSignOut } from '@/hooks/auth';
import { Button } from '@/components/ui/button';

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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow border-b">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <Button 
            variant="outline" 
            onClick={() => signOut().then(() => router.push('/'))}
          >
            Sign Out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="rounded-lg border-4 border-dashed border-gray-200 p-4 min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Welcome to your AI Assistant Dashboard</h2>
              <p>This is where your AI agent interaction will take place.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
