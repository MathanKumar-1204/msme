// Edge Function: acknowledge-invoice (JavaScript)
// Buyer acknowledges an invoice and logs acknowledgement.

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
      .select("id, role, email")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("profile fetch error", profileError);
      return jsonResponse(403, { error: "Profile not found" });
    }

    if (profile.role !== "buyer") {
      return jsonResponse(403, { error: "Only buyers can acknowledge invoices" });
    }

    const { data: invoice, error: invError } = await supabaseAdmin
      .from("invoices")
      .select("id, buyer_email, buyer_acknowledged, status")
      .eq("id", payload.invoice_id)
      .single();

    if (invError || !invoice) {
      console.error("invoice fetch error", invError);
      return jsonResponse(404, { error: "Invoice not found" });
    }

    if (invoice.buyer_email !== profile.email) {
      return jsonResponse(403, { error: "Invoice not addressed to this buyer" });
    }

    if (invoice.buyer_acknowledged) {
      return jsonResponse(200, { success: true, message: "Already acknowledged" });
    }

    const { error: ackError } = await supabaseAdmin
      .from("invoices")
      .update({ buyer_acknowledged: true, status: "Acknowledged" })
      .eq("id", payload.invoice_id);

    if (ackError) {
      console.error("invoice update error", ackError);
      return jsonResponse(500, { error: ackError.message });
    }

    const { error: logError } = await supabaseAdmin
      .from("buyer_acknowledgements")
      .insert({
        invoice_id: payload.invoice_id,
        buyer_id: profile.id,
      });

    if (logError) {
      console.error("acknowledgement log error", logError);
      return jsonResponse(500, { error: logError.message });
    }

    return jsonResponse(200, { success: true });
  } catch (err) {
    console.error("acknowledge-invoice unexpected error", err);
    return jsonResponse(500, { error: "Unexpected server error" });
  }
});


