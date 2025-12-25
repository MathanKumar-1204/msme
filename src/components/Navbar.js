"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const links = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/dashboard/msme", label: "MSME" },
  { href: "/dashboard/buyer", label: "Buyer" },
  { href: "/dashboard/investor", label: "Investor" },
  { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      const hasSession = Boolean(data.session);
      setIsAuthed(hasSession);
      
      if (hasSession && data.session) {
        // Get user role from profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.session.user.id)
          .single();
        setUserRole(profileData?.role || null);
      } else {
        setUserRole(null);
      }
    };
    check();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      check();
    });
    
    return () => subscription.unsubscribe();
  }, []);

  if (pathname?.startsWith("/login") || pathname?.startsWith("/register")) {
    return null;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-indigo-600">
          MSME Finance
        </Link>
        <div className="flex items-center gap-2 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-1.5 transition ${
                pathname === link.href
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {isAuthed && (
            <>
              <span className="hidden text-sm text-slate-500 sm:inline">
                {userRole ?? "User"}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Logout
              </button>
            </>
          )}
          {!isAuthed && (
            <Link
              href="/login"
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

