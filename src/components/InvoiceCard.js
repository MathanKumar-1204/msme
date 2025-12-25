"use client";

import Link from "next/link";

export default function InvoiceCard({ invoice, ctaLabel, onAction }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Invoice #{invoice.invoice_number}
          </p>
          <p className="text-lg font-semibold text-slate-900">
            ${invoice.amount?.toLocaleString()}
          </p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          {invoice.status ?? "Pending"}
        </span>
      </div>
      <div className="mt-3 space-y-2 text-sm text-slate-600">
        <p>Due: {invoice.due_date}</p>
        {invoice.buyer_email && <p>Buyer: {invoice.buyer_email}</p>}
        {invoice.listed_price && (
          <p className="font-medium text-indigo-700">
            Listed: ${invoice.listed_price}
          </p>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
        <span>
          Buyer Ack:{" "}
          <span className="font-medium text-slate-900">
            {invoice.buyer_acknowledged ? "Yes" : "No"}
          </span>
        </span>
        <Link
          href={`/invoice/${invoice.id}`}
          className="text-indigo-600 hover:text-indigo-500"
        >
          View
        </Link>
      </div>
      {ctaLabel && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

