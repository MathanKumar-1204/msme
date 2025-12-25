"use client";

import { supabase } from "./supabaseClient";

// NOTE: These helpers run on the client and assume RLS policies
// permit the current authenticated user to perform these actions.
// They are simpler than Edge Functions but rely on secure RLS rules.

export async function registerUser({ email, password, role, wallet_address }) {
  // Client-side signup using anon key; ensure email/password auth is enabled.
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) throw new Error("User not created");
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    email,
    role,
    wallet_address,
  });
  if (profileError) throw profileError;
  return { userId };
}

export async function createInvoice({
  invoice_number,
  amount,
  due_date,
  buyer_email,
  pdf_url,
  listed_price = null,
}) {
  const { error, data } = await supabase
    .from("invoices")
    .insert({
      invoice_number,
      amount,
      due_date,
      buyer_email,
      buyer_acknowledged: false,
      status: "Pending",
      pdf_url,
      listed_price,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function acknowledgeInvoice({ invoice_id }) {
  const { error } = await supabase
    .from("invoices")
    .update({ buyer_acknowledged: true, status: "Acknowledged" })
    .eq("id", invoice_id);
  if (error) throw error;
  return true;
}

export async function listInvoice({ invoice_id, listed_price }) {
  const { error } = await supabase
    .from("invoices")
    .update({ listed_price, status: "Listed" })
    .eq("id", invoice_id);
  if (error) throw error;
  return true;
}

export async function buyInvoice({ invoice_id }) {
  const { error: purchaseError } = await supabase
    .from("investor_purchases")
    .insert({ invoice_id });
  if (purchaseError) throw purchaseError;

  const { error: updateError } = await supabase
    .from("invoices")
    .update({ status: "Sold" })
    .eq("id", invoice_id);
  if (updateError) throw updateError;
  return true;
}


