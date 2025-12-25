"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const roles = [
  { value: "msme", label: "MSME" },
  { value: "buyer", label: "Buyer" },
  { value: "investor", label: "Investor" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(roles[0].value);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        // Redirect to appropriate dashboard based on role
        supabase
          .from("profiles")
          .select("role")
          .eq("id", data.session.user.id)
          .single()
          .then(({ data: profileData }) => {
            if (profileData?.role === "msme") {
              router.replace("/dashboard/msme");
            } else if (profileData?.role === "buyer") {
              router.replace("/dashboard/buyer");
            } else if (profileData?.role === "investor") {
              router.replace("/dashboard/investor");
            } else {
              router.replace("/marketplace");
            }
          });
      }
    });
  }, [router]);

  const redirectByRole = (userRole) => {
    if (userRole === "msme") router.replace("/dashboard/msme");
    else if (userRole === "buyer") router.replace("/dashboard/buyer");
    else router.replace("/dashboard/investor");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    const userId = data.session?.user?.id;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    redirectByRole(profile?.role ?? role);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 rounded-2xl bg-white p-10 shadow-sm lg:flex-row">
      <div className="flex-1 space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Welcome back
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Login to your dashboard
        </h1>
        <p className="text-slate-600">
          Access role-based dashboards to upload, acknowledge, or invest in
          invoices. Authentication uses Supabase only.
        </p>
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800">
          Buyer acknowledgement remains private; only buyer-facing dashboards
          update invoice verification.
        </div>
        <div className="text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-indigo-600 hover:text-indigo-500">
            Register
          </Link>
        </div>
      </div>
      <div className="flex-1">
        <form
          onSubmit={handleLogin}
          className="space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-6"
        >
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          {message && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {message}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

