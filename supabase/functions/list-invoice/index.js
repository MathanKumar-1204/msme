// Edge Function: list-invoice (JavaScript)
// MSME lists an invoice for sale.

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
  if (
    !payload ||
    typeof payload.invoice_id !== "string" ||
    typeof payload.listed_price !== "number"
  ) {
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

    if (profile.role !== "msme") {
      return jsonResponse(403, { error: "Only MSME can list invoices" });
    }

    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("invoices")
      .select("id, created_by, buyer_acknowledged, status")
      .eq("id", payload.invoice_id)
      .single();

    if (invoiceError || !invoice) {
      console.error("invoice fetch error", invoiceError);
      return jsonResponse(404, { error: "Invoice not found" });
    }

    if (invoice.created_by !== profile.id) {
      return jsonResponse(403, { error: "Cannot list invoice not owned by MSME" });
    }

    const newStatus =
      invoice.buyer_acknowledged || invoice.status === "Acknowledged"
        ? "Listed"
        : "Pending";

    const { error: updateError } = await supabaseAdmin
      .from("invoices")
      .update({
        listed_price: payload.listed_price,
        status: newStatus,
      })
      .eq("id", payload.invoice_id);

    if (updateError) {
      console.error("invoice update error", updateError);
      return jsonResponse(500, { error: updateError.message });
    }

    return jsonResponse(200, { success: true, status: newStatus });
  } catch (err) {
    console.error("list-invoice unexpected error", err);
    return jsonResponse(500, { error: "Unexpected server error" });
  }
});


