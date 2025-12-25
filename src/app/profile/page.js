"use client";

import { useState, useEffect } from "react";
import ProtectedRoute, { useAuth } from "../../components/ProtectedRoute";
import { supabase } from "../../lib/supabaseClient";

const roles = [
  { value: "msme", label: "MSME" },
  { value: "buyer", label: "Buyer" },
  { value: "investor", label: "Investor" },
];

function ProfileInner() {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    email: profile?.email || "",
    role: profile?.role || "msme",
    wallet_address: profile?.wallet_address || "",
  });

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        email: profile.email || "",
        role: profile.role || "msme",
        wallet_address: profile.wallet_address || "",
      });
    }
  }, [profile]);

  const handleEdit = () => {
    setIsEditing(true);
    setMessage("");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      email: profile?.email || "",
      role: profile?.role || "msme",
      wallet_address: profile?.wallet_address || "",
    });
    setMessage("");
  };

  const handleSave = async () => {
    if (!profile?.id) {
      setMessage("Profile ID not found.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Update profile in database
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          email: formData.email,
          role: formData.role,
          wallet_address: formData.wallet_address,
        })
        .eq("id", profile.id);

      if (profileError) {
        setMessage(profileError.message || "Failed to update profile.");
        setLoading(false);
        return;
      }

      // Update user metadata in auth
      const { error: authError } = await supabase.auth.updateUser({
        email: formData.email,
        data: {
          role: formData.role,
          wallet_address: formData.wallet_address,
        },
      });

      if (authError) {
        console.error("Auth update error:", authError);
        // Don't fail if auth update fails, profile update succeeded
      }

      setMessage("Profile updated successfully!");
      setIsEditing(false);
      
      // Reload the page to refresh the profile data
      window.location.reload();
    } catch (err) {
      console.error("Update error:", err);
      setMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Profile
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">Your account</h1>
        <p className="text-slate-600">
          Manage your role, wallet address, and session. Data is stored in
          Supabase.
        </p>
      </header>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.includes("success")
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        {isEditing ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-400">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-400">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">
                Wallet address
              </label>
              <input
                type="text"
                value={formData.wallet_address}
                onChange={(e) =>
                  setFormData({ ...formData, wallet_address: e.target.value })
                }
                placeholder="0x..."
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <p className="mt-1 text-sm text-slate-500">
                Wallet is collected at registration. Investor purchases stay UI-only.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Email
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {profile?.email || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Role
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {profile?.role
                    ? roles.find((r) => r.value === profile.role)?.label ||
                      profile.role
                    : "N/A"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Wallet address
              </p>
              <p className="mt-1 break-all text-lg font-semibold text-slate-900">
                {profile?.wallet_address || "Not provided"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Wallet is collected at registration. Investor purchases stay UI-only.
              </p>
            </div>
            <button
              type="button"
              onClick={handleEdit}
              className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Edit profile
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileInner />
    </ProtectedRoute>
  );
}

