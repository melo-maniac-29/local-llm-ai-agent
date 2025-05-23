import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="max-w-2xl w-full text-center space-y-8">
        <h1 className="text-6xl font-bold">Orbital AI</h1>
        <p className="text-xl">Your intelligent AI assistant for the next generation.</p>
        <div className="mt-10">
          <Link href="/auth">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
