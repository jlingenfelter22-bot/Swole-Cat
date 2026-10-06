import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SHARE_FORMAT = "swole-cat-share";
const SHARE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const SHARE_ACTIVE_CAP = 25;
const SHARE_MAX_BYTES = 250000;
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_BODY_LENGTH = 16;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeCode(value: unknown) {
  const compact = String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!compact.startsWith("SC")) return "";
  const body = compact.slice(2);
  if (body.length !== CODE_BODY_LENGTH) return "";
  for (const ch of body) if (!CODE_ALPHABET.includes(ch)) return "";
  return "SC-" + (body.match(/.{1,4}/g) || []).join("-");
}

function generateCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_BODY_LENGTH));
  let body = "";
  for (const byte of bytes) body += CODE_ALPHABET[byte & 31];
  return "SC-" + (body.match(/.{1,4}/g) || []).join("-");
}

async function sha256Hex(text: string) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function validateEnvelope(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("The shared plan package is invalid.");
  }
  const envelope = value as Record<string, any>;
  if (envelope.format !== SHARE_FORMAT) throw new Error("That is not a Swole Cat share package.");
  const version = Number(envelope.version);
  if (!Number.isInteger(version) || version < 1 || version > 100) {
    throw new Error("The shared plan version is invalid.");
  }
  if (envelope.kind !== "routine" && envelope.kind !== "program") {
    throw new Error("Only routines and programs can be shared.");
  }
  const rawName = envelope.kind === "program" ? envelope.program?.name : envelope.routine?.name;
  const name = String(rawName || "").trim().slice(0, 160);
  if (!name) throw new Error("The shared plan is missing a name.");
  const serialized = JSON.stringify(envelope);
  const payloadBytes = new TextEncoder().encode(serialized).byteLength;
  if (payloadBytes < 1 || payloadBytes > SHARE_MAX_BYTES) {
    throw new Error("That plan is too large to share through Swole Cat Cloud.");
  }
  return { envelope, version, kind: envelope.kind as "routine" | "program", name, payloadBytes };
}

async function cleanupExpired(admin: any) {
  const { error } = await admin.from("plan_shares").delete().lt("expires_at", new Date().toISOString());
  if (error) console.error("Could not prune expired plan shares:", error.message);
}

async function pruneOwnerToRoomForOne(admin: any, ownerId: string) {
  const { data, error } = await admin
    .from("plan_shares")
    .select("id")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .range(SHARE_ACTIVE_CAP - 1, 499);
  if (error) throw error;
  const ids = (data || []).map((row: { id: string }) => row.id).filter(Boolean);
  if (!ids.length) return;
  const { error: deleteError } = await admin.from("plan_shares").delete().in("id", ids);
  if (deleteError) throw deleteError;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json(405, { ok: false, error: "Method not allowed." });

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, error: "A JSON request body is required." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Required Supabase function environment is unavailable.");
    return json(500, { ok: false, error: "Cloud sharing is temporarily unavailable." });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await cleanupExpired(admin);

  if (body.action === "create") {
    const authorization = req.headers.get("Authorization") || "";
    const token = authorization.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json(401, { ok: false, error: "Sign in to create a short cloud share code." });

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user?.id) {
      return json(401, { ok: false, error: "Your cloud session is no longer valid. Sign in again and retry." });
    }

    let validated;
    try {
      validated = validateEnvelope(body.envelope);
    } catch (error) {
      return json(400, { ok: false, error: error instanceof Error ? error.message : "Invalid shared plan." });
    }

    try {
      await pruneOwnerToRoomForOne(admin, user.id);
    } catch (error) {
      console.error("Could not enforce plan-share retention:", error);
      return json(500, { ok: false, error: "Could not prepare cloud sharing right now." });
    }

    const expiresAt = new Date(Date.now() + SHARE_EXPIRY_MS).toISOString();
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      const codeHash = await sha256Hex(normalizeCode(code));
      const { error } = await admin.from("plan_shares").insert({
        owner_id: user.id,
        code_hash: codeHash,
        share_kind: validated.kind,
        share_name: validated.name,
        format_version: validated.version,
        payload_json: validated.envelope,
        payload_bytes: validated.payloadBytes,
        expires_at: expiresAt,
      });
      if (!error) {
        return json(200, {
          ok: true,
          code,
          expiresAt,
          kind: validated.kind,
          name: validated.name,
        });
      }
      if (error.code !== "23505") {
        console.error("Could not create plan share:", error.message);
        return json(500, { ok: false, error: "Could not create a short share code." });
      }
    }
    return json(500, { ok: false, error: "Could not generate a unique share code. Try again." });
  }

  if (body.action === "resolve") {
    const code = normalizeCode(body.code);
    if (!code) return json(400, { ok: false, error: "That Swole Cat share code is invalid." });

    const codeHash = await sha256Hex(code);
    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("plan_shares")
      .select("id,share_kind,share_name,payload_json,expires_at")
      .eq("code_hash", codeHash)
      .gt("expires_at", now)
      .maybeSingle();

    if (error) {
      console.error("Could not resolve plan share:", error.message);
      return json(500, { ok: false, error: "Could not open that shared plan right now." });
    }
    if (!data) {
      return json(404, { ok: false, error: "That share code was not found or has expired." });
    }

    admin.from("plan_shares").update({ last_accessed_at: now }).eq("id", data.id).then(({ error }) => {
      if (error) console.error("Could not update plan-share access time:", error.message);
    });

    return json(200, {
      ok: true,
      envelope: data.payload_json,
      expiresAt: data.expires_at,
      kind: data.share_kind,
      name: data.share_name,
    });
  }

  return json(400, { ok: false, error: "Unknown cloud sharing action." });
});
