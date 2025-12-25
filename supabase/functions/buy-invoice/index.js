// Edge Function: buy-invoice (JavaScript)
// Investor purchases an invoice (off-chain simulation).

// @ts-ignore using Deno npm specifier
import { createClient } from "npm:@supabase/supabase-js";

const SUPABASE_URL =
  typeof Deno !== "undefined" && Deno.env ? Deno.env.get("SUPABASE_URL") ?? "" : "";
const SERVICE_ROLE_KEY =
  typeof Deno !== "undefined" && Deno.env
    ? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    : "";

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const parseRequest = async (req) => {
  try {
    return await req.json();
  } catch (_err) {
    return null;
  }
};

const getUserFromRequest = async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) {
    console.error("getUser error", error);
    return null;
  }
  return data?.user ?? null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const user = await getUserFromRequest(req);
  if (!user) return jsonResponse(401, { error: "Unauthorized" });

  const payload = await parseRequest(req);
  if (!payload || typeof payload.invoice_id !== "string") {
    return jsonResponse(400, { error: "Invalid request body" });
  }

  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("profile fetch error", profileError);
      return jsonResponse(403, { error: "Profile not found" });
    }

    if (profile.role !== "investor") {
      return jsonResponse(403, { error: "Only investors can buy invoices" });
    }

    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("invoices")
      .select("id, status, buyer_acknowledged")
      .eq("id", payload.invoice_id)
      .single();

    if (invoiceError || !invoice) {
      console.error("invoice fetch error", invoiceError);
      return jsonResponse(404, { error: "Invoice not found" });
    }

    if (!invoice.buyer_acknowledged) {
      return jsonResponse(403, { error: "Invoice not acknowledged by buyer" });
    }

    if (invoice.status === "Sold") {
      return jsonResponse(200, { success: true, message: "Already sold" });
    }

    const { error: purchaseError } = await supabaseAdmin
      .from("investor_purchases")
      .insert({
        invoice_id: payload.invoice_id,
        investor_id: profile.id,
      });

    if (purchaseError) {
      console.error("purchase insert error", purchaseError);
      return jsonResponse(500, { error: purchaseError.message });
    }

    const { error: updateError } = await supabaseAdmin
      .from("invoices")
      .update({ status: "Sold" })
      .eq("id", payload.invoice_id);

    if (updateError) {
      console.error("invoice update error", updateError);
      return jsonResponse(500, { error: updateError.message });
    }

    return jsonResponse(200, { success: true });
  } catch (err) {
    console.error("buy-invoice unexpected error", err);
    return jsonResponse(500, { error: "Unexpected server error" });
  }
});


