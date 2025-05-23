'use client';

import Card from '@/components/Card';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';

export default function Welcome() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-6">Welcome to Our Agent</h1>
        <p className="text-gray-600 mb-8">
          Thank you for logging in. Your personal assistant is ready to help you.
        </p>
        <Button onClick={() => router.push('/login')} variant="secondary">
          Sign Out
        </Button>
      </Card>
    </div>
  );
}
