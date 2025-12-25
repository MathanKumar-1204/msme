"use client";

import { useEffect, useMemo, useState } from "react";
import InvoiceCard from "../../components/InvoiceCard";
import { supabase } from "../../lib/supabaseClient";

export default function MarketplacePage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ minAmount: "", maxAmount: "", due: "" });
  const [message, setMessage] = useState("");

  const loadInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("buyer_acknowledged", true)
      .order("due_date", { ascending: true });

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
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const min = filters.minAmount ? Number(filters.minAmount) : null;
      const max = filters.maxAmount ? Number(filters.maxAmount) : null;
      const due = filters.due ? new Date(filters.due) : null;

      const amountOk =
        (min === null || Number(inv.amount) >= min) &&
        (max === null || Number(inv.amount) <= max);
      const dueOk = !due || new Date(inv.due_date) <= due;

      return amountOk && dueOk;
    });
  }, [filters, invoices]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Public marketplace
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Acknowledged Invoice Marketplace
        </h1>
        <p className="text-slate-600">
          Browse buyer-verified invoices. Connect wallet and proceed to investor
          dashboard to purchase. All blockchain interactions stay client-side.
        </p>
      </header>

      <section className="grid gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Min amount</label>
          <input
            type="number"
            value={filters.minAmount}
            onChange={(e) => setFilters((p) => ({ ...p, minAmount: e.target.value }))}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Max amount</label>
          <input
            type="number"
            value={filters.maxAmount}
            onChange={(e) => setFilters((p) => ({ ...p, maxAmount: e.target.value }))}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Due before</label>
          <input
            type="date"
            value={filters.due}
            onChange={(e) => setFilters((p) => ({ ...p, due: e.target.value }))}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </section>

      {message && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          Loading acknowledged invoices...
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          No invoices match the selected filters.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredInvoices.map((inv) => (
            <InvoiceCard key={inv.id} invoice={inv} ctaLabel="View details" />
          ))}
        </div>
      )}
    </div>
  );
}

