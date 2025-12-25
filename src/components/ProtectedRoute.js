"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext({ session: null, profile: null });

export const useAuth = () => useContext(AuthContext);

export default function ProtectedRoute({ children, allowedRoles }) {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Use the same promise-based approach as register/login pages
    // This ensures we wait for localStorage to be read
    const load = () => {
      supabase.auth.getSession().then(({ data, error }) => {
        if (!mounted) return;

        if (error || !data?.session) {
          console.log("No session found, redirecting to login");
          router.replace("/login");
          return;
        }

        setSession(data.session);
        const userId = data.session.user.id;
        const userRole = data.session.user.user_metadata?.role;

        // Fetch profile data from database
        supabase
          .from("profiles")
          .select("id, email, role, wallet_address")
          .eq("id", userId)
          .single()
          .then(({ data: profileData, error: profileError }) => {
            if (!mounted) return;

            // If profile doesn't exist in DB, try to use user_metadata role as fallback
            let finalRole = profileData?.role || userRole;
            let finalProfile = profileData;

            // If no profile in DB but we have user_metadata, create a minimal profile object
            if (profileError && userRole) {
              console.log("Profile not found in DB, using user_metadata role:", userRole);
              finalProfile = {
                id: userId,
                email: data.session.user.email,
                role: userRole,
                wallet_address: data.session.user.user_metadata?.wallet_address || null,
              };
            } else if (profileError) {
              console.error("Profile error:", profileError);
              router.replace("/login");
              return;
            }

            // Check role permissions
            if (
              allowedRoles &&
              Array.isArray(allowedRoles) &&
              finalRole &&
              !allowedRoles.includes(finalRole)
            ) {
              console.log(`Role ${finalRole} not in allowed roles:`, allowedRoles);
              router.replace("/login");
              return;
            }

            if (finalProfile) {
              setProfile(finalProfile);
            }
            setLoading(false);
          })
          .catch((err) => {
            console.error("Profile fetch error:", err);
            // If we have user_metadata role, use it as fallback
            if (userRole && mounted) {
              const fallbackProfile = {
                id: userId,
                email: data.session.user.email,
                role: userRole,
                wallet_address: data.session.user.user_metadata?.wallet_address || null,
              };
              
              if (
                !allowedRoles ||
                !Array.isArray(allowedRoles) ||
                allowedRoles.includes(userRole)
              ) {
                setProfile(fallbackProfile);
                setLoading(false);
              } else {
                router.replace("/login");
              }
            } else if (mounted) {
              router.replace("/login");
            }
          });
      }).catch((err) => {
        console.error("Session fetch error:", err);
        if (mounted) {
          router.replace("/login");
        }
      });
    };

    // Load immediately (Supabase handles localStorage reading internally)
    load();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, sess) => {
        if (!mounted) return;

        if (event === "SIGNED_OUT") {
          router.replace("/login");
          return;
        }

        if (sess) {
          setSession(sess);
          // Reload profile when session changes
          supabase
            .from("profiles")
            .select("id, email, role, wallet_address")
            .eq("id", sess.user.id)
            .single()
            .then(({ data: profileData }) => {
              if (mounted && profileData) {
                setProfile(profileData);
              }
            });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [allowedRoles, router]);

  const value = useMemo(() => ({ session, profile }), [session, profile]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

