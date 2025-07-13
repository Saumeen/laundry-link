"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { UserRole } from "@/types/global";
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { usePageTransition } from "@/components/ui/PageTransition";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

export default function AdminLoginPage() {
  const router = useRouter();
  const { isTransitioning, navigateWithTransition } = usePageTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError("");
  }, [error]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError("");
  }, [error]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("admin-credentials", {
        username: email,
        password: password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid credentials or account inactive");
        setLoading(false);
        return;
      }

      console.log("SignIn result:", result); // Debug log

      // Wait for session to be available with retries
      let session = null;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!session && attempts < maxAttempts) {
        console.log(`Attempt ${attempts + 1} to get session...`); // Debug log
        session = await getSession();
        
        if (!session) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }
      }

      console.log("Final session after login:", session); // Debug log

      if (session?.userType === "admin" && session?.role) {
        // Redirect based on role
        const role = session.role as UserRole;
        console.log("Redirecting to role:", role); // Debug log
        
        switch (role) {
          case "SUPER_ADMIN":
            navigateWithTransition("/admin/super-admin", 500);
            break;
          case "OPERATION_MANAGER":
            navigateWithTransition("/admin/operation-manager", 500);
            break;
          case "DRIVER":
            navigateWithTransition("/admin/driver", 500);
            break;
          case "FACILITY_TEAM":
            navigateWithTransition("/admin/facility-team", 500);
            break;
          default:
            navigateWithTransition("/admin", 500);
        }
      } else {
        console.log("Session validation failed:", { userType: session?.userType, role: session?.role }); // Debug log
        setError("Invalid admin session - please try again");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login");
    } finally {
      setLoading(false);
    }
  }, [email, password, router]);

  return (
    <>
      <LoadingOverlay isVisible={isTransitioning} message="Redirecting to dashboard..." />
      <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8 transition-all duration-700 ease-in-out ${
        isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
      }`}>
      <div className="max-w-md w-full">
        {/* Card Container */}
        <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-700 ease-in-out transform ${
          isTransitioning ? "translate-y-8 opacity-0" : "translate-y-0 opacity-100"
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                Admin Portal
              </h2>
              <p className="mt-2 text-blue-100 text-sm">
                Sign in to access your dashboard
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleEmailChange}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Secure access to LaundryLink administration
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Having trouble? Contact your system administrator
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
