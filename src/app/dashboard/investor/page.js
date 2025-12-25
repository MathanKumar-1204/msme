"use client";

import { useEffect, useMemo, useState } from "react";
import InvoiceCard from "../../../components/InvoiceCard";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { supabase } from "../../../lib/supabaseClient";
import { purchaseInvoiceOnChain } from "../../../lib/contractUtils";

function InvestorDashboardInner() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  const loadInvoices = async () => {
    setLoading(true);
    // Fetch invoices
    const { data: invoicesData, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("buyer_acknowledged", true)
      .not("status", "eq", "Sold")
      .order("due_date", { ascending: true });

    if (error) {
      setMessage(error.message);
      setInvoices([]);
      setLoading(false);
      return;
    }

    // Fetch MSME wallet addresses for each invoice
    if (invoicesData && invoicesData.length > 0) {
      const msmeIds = [...new Set(invoicesData.map(inv => inv.created_by))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, wallet_address")
        .in("id", msmeIds);

      // Map wallet addresses to invoices
      const walletMap = {};
      if (profilesData) {
        profilesData.forEach(profile => {
          walletMap[profile.id] = profile.wallet_address;
        });
      }

      const invoicesWithWallets = invoicesData.map(inv => ({
        ...inv,
        msme_wallet_address: walletMap[inv.created_by] || null,
      }));

      setInvoices(invoicesWithWallets);
    } else {
      setInvoices([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleConnectWallet = async () => {
    setMessage("");
    if (typeof window === "undefined" || !window.ethereum) {
      setMessage("MetaMask not detected. Please install or enable it.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts?.[0]) {
        setWalletAddress(accounts[0]);
        setIsWalletConnected(true);
      }
    } catch (err) {
      setMessage(err?.message ?? "Unable to connect wallet.");
    }
  };

  const handleBuy = async (invoice) => {
    if (!isWalletConnected) {
      setMessage("Connect MetaMask first to proceed with purchase.");
      return;
    }

    if (!invoice.listed_price) {
      setMessage("Invoice price not set. Cannot purchase.");
      return;
    }

    // Get MSME owner wallet address
    let msmeWalletAddress = invoice.msme_wallet_address;
    
    // If not available, fetch it separately
    if (!msmeWalletAddress && invoice.created_by) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("wallet_address")
        .eq("id", invoice.created_by)
        .single();
      msmeWalletAddress = profileData?.wallet_address;
    }

    if (!msmeWalletAddress) {
      setMessage("MSME owner wallet address not found. Cannot process purchase.");
      return;
    }

    setLoading(true);
    setMessage("Processing blockchain transaction...");

    try {
      // Purchase on blockchain
      const receipt = await purchaseInvoiceOnChain(invoice.id, invoice.listed_price);
      
      // Update Supabase after successful blockchain transaction
      const { error } = await supabase
        .from("invoices")
        .update({ 
          status: "Sold",
          blockchain_tx_hash: receipt.transactionHash 
        })
        .eq("id", invoice.id);

      if (error) {
        console.error("Supabase update error:", error);
        // Transaction succeeded on blockchain but Supabase update failed
        setMessage(
          `Purchase successful on blockchain! Transaction: ${receipt.transactionHash}. ` +
          "However, database update failed. Please contact support."
        );
      } else {
        setMessage(
          `Purchase successful! Transaction hash: ${receipt.transactionHash}`
        );
      }

      loadInvoices();
    } catch (error) {
      console.error("Purchase error:", error);
      if (error.code === 4001) {
        setMessage("Transaction rejected by user.");
      } else if (error.message?.includes("insufficient funds")) {
        setMessage("Insufficient funds in wallet. Please add more ETH.");
      } else if (error.message?.includes("already sold")) {
        setMessage("Invoice has already been sold.");
      } else {
        setMessage(
          `Purchase failed: ${error.message || "Unknown error. Please try again."}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const portfolioValue = useMemo(
    () =>
      invoices.reduce(
        (acc, inv) => acc + (Number(inv.listed_price) || Number(inv.amount) || 0),
        0
      ),
    [invoices]
  );

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Investor workspace
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Investor Dashboard
        </h1>
        <p className="text-slate-600">
          Browse acknowledged invoices and execute UI-only purchase flows. All
          blockchain interactions remain on the client.
        </p>
      </header>

      <div className="grid gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:grid-cols-3">
        <div className="rounded-xl bg-indigo-50 p-4">
          <p className="text-xs uppercase tracking-wide text-indigo-600">
            Wallet
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {isWalletConnected ? walletAddress : "Not connected"}
          </p>
          <button
            type="button"
            onClick={handleConnectWallet}
            className="mt-3 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            {isWalletConnected ? "Reconnect" : "Connect MetaMask"}
          </button>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Acknowledged deals
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {invoices.length}
          </p>
          <p className="text-sm text-slate-600">
            Only buyer-verified invoices appear here.
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Potential value
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            ${portfolioValue.toLocaleString()}
          </p>
          <p className="text-sm text-slate-600">Sum of listed or face values.</p>
        </div>
      </div>

      {message && (
        <div className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          Loading marketplace deals...
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          No acknowledged invoices available yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {invoices.map((inv) => (
            <InvoiceCard
              key={inv.id}
              invoice={inv}
              ctaLabel="Buy Invoice"
              onAction={() => handleBuy(inv)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function InvestorDashboard() {
  return (
    <ProtectedRoute allowedRoles={["investor"]}>
      <InvestorDashboardInner />
    </ProtectedRoute>
  );
}

