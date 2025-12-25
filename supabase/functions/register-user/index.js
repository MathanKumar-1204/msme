// Edge Function: register-user (JavaScript)
// Creates auth user with service role and inserts into profiles table.

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const payload = await parseRequest(req);
  if (
    !payload ||
    typeof payload.email !== "string" ||
    typeof payload.password !== "string" ||
    typeof payload.role !== "string" ||
    typeof payload.wallet_address !== "string"
  ) {
    return jsonResponse(400, { error: "Invalid request body" });
  }

  const { email, password, role, wallet_address } = payload;

  try {
    const { data: userData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createError || !userData?.user) {
      console.error("createUser error", createError);
      return jsonResponse(500, {
        error: createError?.message ?? "User creation failed",
      });
    }

    const userId = userData.user.id;

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      email,
      role,
      wallet_address,
    });

    if (profileError) {
      console.error("profile insert error", profileError);
      return jsonResponse(500, { error: profileError.message });
    }

    return jsonResponse(200, { success: true, user_id: userId });
  } catch (err) {
    console.error("register-user unexpected error", err);
    return jsonResponse(500, { error: "Unexpected server error" });
  }
});


