"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AdminUser } from "@/types/global";
import { ToastProvider } from "@/components/ui/Toast";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  user: AdminUser | null;
  onLogout: () => void;
}

export default function AdminLayout({ children, title, user, onLogout }: AdminLayoutProps) {
  const router = useRouter();

  const handleLogout = () => {
    onLogout();
    router.push("/admin/login");
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              </div>
              <div className="flex items-center space-x-4">
                {user && (
                  <span className="text-sm text-gray-600">
                    Welcome, {user.firstName} {user.lastName}
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
} 