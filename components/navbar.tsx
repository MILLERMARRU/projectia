"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Home,
  UserRound,
  Stethoscope,
  FileText,
  Menu,
  X,
  Hospital,
  LogOut,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ElementType };

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Inicio", icon: Home },
  { href: "/admin/pacientes", label: "mi semana", icon: UserRound },
  { href: "/admin/consultas", label: "kanban", icon: Stethoscope },
  { href: "/admin/historiales", label: "calendario", icon: FileText },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    // Para la página de inicio (/admin), solo debe estar activa si estamos exactamente en esa ruta
    if (href === "/admin") {
      return pathname === "/admin";
    }
    // Para las demás rutas, usar la lógica original
    return pathname === href || pathname.startsWith(href + "/");
  };

  const itemClass = (active: boolean) =>
    [
      "inline-flex items-center gap-2 rounded-xl px-4 py-4 text-sm font-medium",
      "transition-colors cursor-pointer select-none",
      active
        ? "bg-blue-100 text-blue-700"
        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
    ].join(" ");

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/100 backdrop-blur">
      <nav className="w-full flex h-20 items-center justify-between px-8 py-8">
        {/* Brand */}
        <Link href="/admin" className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">
            <Hospital size={18} />
          </span>
          <span className="text-lg font-bold text-gray-700">TopicUcss</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={itemClass(isActive(href))}
              >
                <Icon size={16} />
                {label}
              </Link>
            </li>
          ))}
          <li className="ml-2">
            <button
              onClick={logout}
              className="inline-flex items-center justify-center rounded-xl p-3 text-white bg-red-500 hover:bg-red-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </li>
        </ul>

        {/* Mobile: hamburger */}
        <button
          className="md:hidden rounded-lg p-2 hover:bg-gray-100"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={`md:hidden border-t bg-white/70 transition-all ${
          open ? "max-h-96" : "max-h-0 overflow-hidden"
        }`}
      >
        <ul className="px-8 py-3 space-y-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                className={itemClass(isActive(href))}
              >
                <Icon size={16} />
                {label}
              </Link>
            </li>
          ))}
          <li>
            <button
              onClick={logout}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white bg-red-500 hover:bg-red-600 hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </li>
        </ul>
      </div>
    </header>
  );
}
