
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

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [wallet, setWallet] = useState("");
  const [role, setRole] = useState(roles[0].value);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

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

  const redirectByRole = (roleValue) => {
    if (roleValue === "msme") router.replace("/dashboard/msme");
    else if (roleValue === "buyer") router.replace("/dashboard/buyer");
    else router.replace("/dashboard/investor");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess("");
  
    try {
      // Create signup request with timeout handling
      const signUpResponse = await Promise.race([
        supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
            data: {
              role,
              wallet_address: wallet,
            },
          },
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Request timeout - server took too long to respond")), 25000)
        ),
      ]);

      const { data, error } = signUpResponse;
  
      if (error) {
        // Check for network/timeout errors
        if (error.status === 504 || error.message?.includes('504') || error.message?.includes('timeout')) {
          setMessage("Server timeout. This may be due to email sending delays. Your account might still be created - please try logging in or check your email.");
        } else {
          setMessage(error.message || "Registration failed. Please try again.");
        }
        setLoading(false);
        return;
      }
  
      if (!data?.user) {
        setMessage("Signup failed. No user returned.");
        setLoading(false);
        return;
      }
  
      const userId = data.user.id;
  
      // Create the profile record
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          email,
          role,
          wallet_address: wallet,
        });
  
      if (profileError) {
        setMessage(profileError.message || "Failed to create profile.");
        setLoading(false);
        return;
      }
  
      if (data.session) {
        redirectByRole(role);
      } else {
        setSuccess("Account created. Please check your email to verify your account.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      if (err.message?.includes('timeout') || err.message?.includes('504')) {
        setMessage("Request timed out. The server may be processing your request. Please wait a moment and try logging in, or check your email for a confirmation link.");
      } else {
        setMessage(err.message || "Unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 rounded-2xl bg-white p-10 shadow-sm lg:flex-row">
      <div className="flex-1 space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Get started
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Create your MSME finance account
        </h1>
        <p className="text-slate-600">
          Select your role, add wallet address, and access tailored dashboards.
          All auth and data are managed through Supabase.
        </p>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
          Use a valid buyer email if you register as a buyer. Investors only need
          wallet UI; blockchain interactions stay client-side.
        </div>
        <div className="text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-500">
            Login
          </Link>
        </div>
      </div>
      <div className="flex-1">
        <form
          onSubmit={handleRegister}
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
            <label className="text-sm font-medium text-slate-700">
              Password
            </label>
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
          <div>
            <label className="text-sm font-medium text-slate-700">
              Wallet address
            </label>
            <input
              type="text"
              required
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="0x..."
            />
          </div>
          {message && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {message}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              {success}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}

