"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadInvoice = async () => {
      if (!params?.id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", params.id)
        .single();
      if (error) {
        setMessage(error.message);
      } else {
        setInvoice(data);
      }
      setLoading(false);
    };
    loadInvoice();
  }, [params?.id]);

  const handleBuy = () => {
    setMessage(
      "This is a UI-only purchase. Connect wallet on investor dashboard to continue."
    );
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        Loading invoice...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
        Invoice not found.{" "}
        <button
          type="button"
          className="font-semibold underline"
          onClick={() => router.back()}
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Invoice detail
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Invoice #{invoice.invoice_number}
        </h1>
        <p className="text-slate-600">
          Buyer acknowledgement is {invoice.buyer_acknowledged ? "confirmed" : "pending"}
          . Status: {invoice.status ?? "Pending"}.
        </p>
      </header>

      {message && (
        <div className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          {message}
        </div>
      )}

      <div className="grid gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:grid-cols-3">
        <div className="space-y-2 text-sm text-slate-600">
          <p className="text-xs uppercase tracking-wide text-slate-400">Amount</p>
          <p className="text-xl font-semibold text-slate-900">
            ${Number(invoice.amount).toLocaleString()}
          </p>
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <p className="text-xs uppercase tracking-wide text-slate-400">Due date</p>
          <p className="text-lg font-semibold text-slate-900">{invoice.due_date}</p>
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Buyer acknowledgement
          </p>
          <p className="text-lg font-semibold text-slate-900">
            {invoice.buyer_acknowledged ? "Acknowledged" : "Pending"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Invoice PDF</p>
            <p className="text-sm text-slate-600">Preview or download the file.</p>
          </div>
          {invoice.pdf_url && (
            <a
              href={invoice.pdf_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Open PDF
            </a>
          )}
        </div>
        {invoice.pdf_url && (
          <iframe
            title="Invoice PDF"
            src={invoice.pdf_url}
            className="mt-4 h-[500px] w-full rounded-lg border border-slate-100"
          />
        )}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              NFT / Sale status: {invoice.status ?? "Pending"}
            </p>
            <p className="text-sm text-slate-600">
              Investors can proceed only after buyer acknowledgement.
            </p>
          </div>
          {invoice.buyer_acknowledged && invoice.status !== "Sold" && (
            <button
              type="button"
              onClick={handleBuy}
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Buy Invoice (UI only)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

