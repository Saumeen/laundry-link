"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { UserRole } from "@/types/global";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
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
            router.push("/admin/super-admin");
            break;
          case "OPERATION_MANAGER":
            router.push("/admin/operation-manager");
            break;
          case "DRIVER":
            router.push("/admin/driver");
            break;
          case "FACILITY_TEAM":
            router.push("/admin/facility-team");
            break;
          default:
            router.push("/admin");
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
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
