// Edge Function: create-invoice (JavaScript)
// MSME creates invoice rows in invoices table.

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
    typeof payload.invoice_number !== "string" ||
    typeof payload.amount !== "number" ||
    typeof payload.due_date !== "string" ||
    typeof payload.buyer_email !== "string" ||
    typeof payload.pdf_url !== "string"
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
      return jsonResponse(403, { error: "Only MSME can create invoices" });
    }

    const { error: insertError, data } = await supabaseAdmin
      .from("invoices")
      .insert({
        invoice_number: payload.invoice_number,
        amount: payload.amount,
        due_date: payload.due_date,
        buyer_email: payload.buyer_email,
        buyer_acknowledged: false,
        status: "Pending",
        pdf_url: payload.pdf_url,
        listed_price: null,
        created_by: profile.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("invoice insert error", insertError);
      return jsonResponse(500, { error: insertError.message });
    }

    return jsonResponse(200, { success: true, invoice: data });
  } catch (err) {
    console.error("create-invoice unexpected error", err);
    return jsonResponse(500, { error: "Unexpected server error" });
  }
});


