"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import AIAssistant from "@/components/layout/AIAssistant";
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
    document.title = "Tradingsafe Portal";
    const token = localStorage.getItem('admin_token');
    if (!token && pathname !== '/login') {
      setAuthorized(false);
      router.push('/login');
    } else {
      setAuthorized(true);
    }
  }, [pathname, router]);

  if (pathname === '/login') {
    return (
      <html lang="en">
        <head>
          <title>Tradingsafe Portal</title>
          <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22 font-weight=%22bold%22 fill=%22%2338bdf8%22>TS</text></svg>" />
        </head>
        <body>{children}</body>
      </html>
    );
  }

  if (!authorized) {
    return (
      <html lang="en">
        <head>
          <title>Tradingsafe Portal</title>
          <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22 font-weight=%22bold%22 fill=%22%2338bdf8%22>TS</text></svg>" />
        </head>
        <body className="bg-[#050507]"></body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>Tradingsafe Portal</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22 font-weight=%22bold%22 fill=%22%2338bdf8%22>TS</text></svg>" />
      </head>
      <body className="bg-[#050507] text-[#e0e0e6] flex h-screen overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {children}
          </main>
        </div>
        <AIAssistant />
      </body>
    </html>
  );
}
