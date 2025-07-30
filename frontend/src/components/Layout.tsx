import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  BarChart3,
  Search,
  Activity,
  FileText,
  AlertCircle,
  Home,
  Settings,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();

  const navigation = [
    {
      name: 'Overview',
      href: '/',
      icon: Home,
      current: router.pathname === '/',
    },
    {
      name: 'Query Analytics',
      href: '/queries',
      icon: Search,
      current: router.pathname === '/queries',
    },
    {
      name: 'Performance',
      href: '/performance',
      icon: Activity,
      current: router.pathname === '/performance',
    },
    // {
    //   name: "FAQ Stats",
    //   href: "/faq-stats",
    //   icon: FileText,
    //   current: router.pathname === "/faq-stats",
    // },
    {
      name: 'Unanswered',
      href: '/unanswered',
      icon: AlertCircle,
      current: router.pathname === '/unanswered',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <BarChart3 className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">
                FAQ Analytics
              </span>
            </div>
            <nav className="mt-8 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    item.current
                      ? 'bg-primary-50 border-r-2 border-primary-600 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-sm font-medium`}
                >
                  <item.icon
                    className={`${
                      item.current
                        ? 'text-primary-500'
                        : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 flex-shrink-0 h-5 w-5`}
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white border-b border-gray-200">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          >
            <span className="sr-only">Open sidebar</span>
            <BarChart3 className="h-6 w-6" />
          </button>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
