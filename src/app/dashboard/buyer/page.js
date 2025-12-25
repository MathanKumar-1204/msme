"use client";

import { useEffect, useState } from "react";
import InvoiceCard from "../../../components/InvoiceCard";
import ProtectedRoute, { useAuth } from "../../../components/ProtectedRoute";
import { supabase } from "../../../lib/supabaseClient";

function BuyerDashboardInner() {
  const { profile } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadInvoices = async () => {
    if (!profile?.email) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("buyer_email", profile.email)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setInvoices([]);
    } else {
      setInvoices(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.email]);

  const handleAcknowledge = async (invoiceId) => {
    setMessage("");
    const { error } = await supabase
      .from("invoices")
      .update({ buyer_acknowledged: true, status: "Acknowledged" })
      .eq("id", invoiceId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Invoice acknowledged. Status updated privately.");
    loadInvoices();
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Buyer workspace
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Buyer Dashboard</h1>
        <p className="text-slate-600">
          Review invoices sent to you and acknowledge privately to unlock
          investor access.
        </p>
      </header>

      {message && (
        <div className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          Loading invoices...
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          No invoices awaiting your acknowledgement.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {invoices.map((inv) => (
            <InvoiceCard
              key={inv.id}
              invoice={inv}
              ctaLabel={inv.buyer_acknowledged ? "Acknowledged" : "Acknowledge"}
              onAction={
                inv.buyer_acknowledged
                  ? undefined
                  : () => handleAcknowledge(inv.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function BuyerDashboard() {
  return (
    <ProtectedRoute allowedRoles={["buyer"]}>
      <BuyerDashboardInner />
    </ProtectedRoute>
  );
}

