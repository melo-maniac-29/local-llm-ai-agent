import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const pathname = usePathname();
  
  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
    },
    {
      name: 'Chat with Agent',
      href: '/dashboard/chat',
    },
    // Add the debug page, but only in development
    ...(process.env.NODE_ENV === 'development' ? [{
      name: 'Debug Chat',
      href: '/dashboard/chat/debug',
    }] : [])
  ];

  return (
    <div className="bg-slate-900 text-white w-64 min-h-screen p-4">
      <div className="text-2xl font-bold mb-8">Orbital AI</div>
      <nav>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "block py-2 px-4 rounded transition-colors",
                  pathname === item.href 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-300 hover:bg-slate-800"
                )}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
