"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth).then(() => {
      router.push("/");
    });
  };

  const links = [
    { href: "/account/profile", label: "Profile" },
    { href: "/account/addresses", label: "Addresses" },
    { href: "/account/orders", label: "Orders" },
    { href: "/account/payment-methods", label: "Payments" },
  ];

  return (
    <div>
      {/* Top Navbar */}
      <nav className="bg-white shadow p-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <img src="/images/toplogo.png" alt="Laundry Link" className="h-10" />
          <span className="text-xl font-bold text-blue-600">Laundry Link</span>
        </Link>

        <div className="flex items-center space-x-4">
          <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>

          {user && (
            <>
              <span className="text-gray-600">👤 {user?.displayName || user?.phoneNumber}</span>
              <Link href="/account/profile" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                My Account
              </Link>
              <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                Logout
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Account Links */}
      <div className="flex space-x-6 p-4 border-b mb-6">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? "font-bold text-blue-600" : "text-gray-600 hover:text-blue-600"}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="p-8">{children}</div>
    </div>
  );
}
