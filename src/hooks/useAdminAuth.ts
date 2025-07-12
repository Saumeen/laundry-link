"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AdminUser, UserRole } from "@/types/global";

export function useAdminAuth(requiredRole?: UserRole) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!session || session.userType !== "admin") {
      router.push("/admin/login");
      return;
    }

    // Check if user has the required role
    if (requiredRole && session.role !== requiredRole) {
      router.push("/admin/login");
      return;
    }

    // Create admin user object from session
    const user: AdminUser = {
      id: session.adminId || 0,
      email: session.user?.email || "",
      firstName: session.user?.name?.split(" ")[0] || "",
      lastName: session.user?.name?.split(" ").slice(1).join(" ") || "",
      role: session.role || "SUPER_ADMIN",
      isActive: true,
    };

    setAdminUser(user);
    setLoading(false);
  }, [session, status, router, requiredRole]);

  const logout = () => {
    signOut({ callbackUrl: "/admin/login" });
  };

  return {
    adminUser,
    loading: status === "loading" || loading,
    logout,
    isAuthenticated: !!adminUser,
  };
} 