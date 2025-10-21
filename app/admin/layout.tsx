"use client";
import Navbar from "@/components/navbar";
import { useAutoLogout } from "@/hooks/useAutoLogout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAutoLogout();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
