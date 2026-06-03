"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token && pathname !== '/login') {
      router.push('/login');
    } else {
      setAuthorized(true);
    }
  }, [pathname, router]);

  if (pathname === '/login') {
    return <html lang="en"><body>{children}</body></html>;
  }

  if (!authorized) {
    return <html lang="en"><body className="bg-[#050507]"></body></html>;
  }

  return (
    <html lang="en">
      <body className="bg-[#050507] text-[#e0e0e6] flex h-screen overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
