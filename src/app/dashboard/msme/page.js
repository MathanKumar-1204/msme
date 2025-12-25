"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import ProtectedRoute, { useAuth } from "../../../components/ProtectedRoute";

function MsmeDashboardInner() {
  const { profile } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    invoice_number: "",
    amount: "",
    due_date: "",
    buyer_email: "",
    listed_price: "",
  });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const fetchInvoices = async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("created_by", profile.id)
      .order("created_at", { ascending: false });
    if (error) {
      setMessage(error.message);
    } else {
      setInvoices(data ?? []);
    }
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please attach invoice PDF.");
      return;
    }
    setLoading(true);
    setMessage("");

    const path = `${profile.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("msme")
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      setMessage(uploadError.message);
      setLoading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("msme")
      .getPublicUrl(path);

    const { error: insertError } = await supabase.from("invoices").insert({
      invoice_number: form.invoice_number,
      amount: Number(form.amount),
      due_date: form.due_date,
      buyer_email: form.buyer_email,
      buyer_acknowledged: false,
      status: "Pending",
      pdf_url: publicUrlData?.publicUrl,
      listed_price: form.listed_price ? Number(form.listed_price) : null,
      created_by: profile.id,
    });

    if (insertError) {
      setMessage(insertError.message);
      setLoading(false);
      return;
    }

    setForm({
      invoice_number: "",
      amount: "",
      due_date: "",
      buyer_email: "",
      listed_price: "",
    });
    setFile(null);
    fetchInvoices();
    setMessage("Invoice uploaded successfully.");
    setLoading(false);
  };

  const handleListForSale = async (invoiceId, listedPrice) => {
    const { error } = await supabase
      .from("invoices")
      .update({ status: "Tokenized", listed_price: listedPrice })
      .eq("id", invoiceId);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Invoice listed for investors.");
      fetchInvoices();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">MSME Dashboard</h1>
        <p className="text-slate-600">
          Upload invoices, track buyer acknowledgement, and list verified
          invoices for investors.
        </p>
      </div>

      <form
        onSubmit={handleUpload}
        className="grid gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:grid-cols-2"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Invoice number
            </label>
            <input
              required
              value={form.invoice_number}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, invoice_number: e.target.value }))
              }
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Amount</label>
              <input
                type="number"
                required
                value={form.amount}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Listed price (optional)
              </label>
              <input
                type="number"
                value={form.listed_price}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, listed_price: e.target.value }))
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Due date
              </label>
              <input
                type="date"
                required
                value={form.due_date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, due_date: e.target.value }))
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Buyer email
              </label>
              <input
                type="email"
                required
                value={form.buyer_email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, buyer_email: e.target.value }))
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">PDF</label>
            <input
              type="file"
              accept="application/pdf"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </div>
          {message && (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {message}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload invoice"}
          </button>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Workflow guidance</p>
          <ul className="mt-2 list-disc space-y-2 pl-4">
            <li>Buyer acknowledgement is required before investor purchase.</li>
            <li>Use clear invoice numbers and due dates.</li>
            <li>Set listed price to the discounted sale value for investors.</li>
          </ul>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Your invoices</h2>
        {invoices.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No invoices yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="px-2 py-2">Invoice</th>
                  <th className="px-2 py-2">Amount</th>
                  <th className="px-2 py-2">Due</th>
                  <th className="px-2 py-2">Buyer</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Listed</th>
                  <th className="px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-slate-100">
                    <td className="px-2 py-2 font-semibold text-slate-900">
                      {inv.invoice_number}
                    </td>
                    <td className="px-2 py-2">${inv.amount}</td>
                    <td className="px-2 py-2">{inv.due_date}</td>
                    <td className="px-2 py-2">{inv.buyer_email}</td>
                    <td className="px-2 py-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      {inv.listed_price ? `$${inv.listed_price}` : "-"}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleListForSale(
                            inv.id,
                            inv.listed_price ?? form.listed_price ?? 0
                          )
                        }
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
                      >
                        List for sale
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MsmeDashboard() {
  return (
    <ProtectedRoute allowedRoles={["msme"]}>
      <MsmeDashboardInner />
    </ProtectedRoute>
  );
}

