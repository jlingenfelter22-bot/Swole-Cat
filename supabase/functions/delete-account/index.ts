import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const SWOLE_CAT_BACKUP_BUCKET = "swole-cat-backups";

async function deleteUserCloudBackups(admin: any, userId: string) {
  for (let pass = 0; pass < 50; pass++) {
    const { data, error } = await admin.storage
      .from(SWOLE_CAT_BACKUP_BUCKET)
      .list(userId, { limit: 100, offset: 0 });

    if (error) {
      console.error("Could not list cloud backups during account deletion:", error.message);
      throw new Error("Could not remove cloud backup files.");
    }

    const paths = (data || [])
      .filter((item: { name?: string }) => item?.name)
      .map((item: { name: string }) => `${userId}/${item.name}`);

    if (!paths.length) break;

    const { error: removeError } = await admin.storage
      .from(SWOLE_CAT_BACKUP_BUCKET)
      .remove(paths);

    if (removeError) {
      console.error("Could not remove cloud backups during account deletion:", removeError.message);
      throw new Error("Could not remove cloud backup files.");
    }

    if (paths.length < 100) break;
  }

  const { error: metadataError } = await admin
    .from("backup_metadata")
    .delete()
    .eq("owner_id", userId);

  if (metadataError) {
    console.error("Could not remove cloud backup metadata during account deletion:", metadataError.message);
    throw new Error("Could not remove cloud backup metadata.");
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  const authorization = req.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return json(401, { error: "Authentication required." });
  }

  let body: { confirm?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "A JSON request body is required." });
  }
  if (body.confirm !== true) {
    return json(400, { error: "Account deletion was not explicitly confirmed." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Required Supabase function environment is unavailable.");
    return json(500, { error: "Account deletion is temporarily unavailable." });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user?.id) {
    return json(401, { error: "Your session is no longer valid. Sign in again and retry." });
  }

  try {
    await deleteUserCloudBackups(admin, user.id);
  } catch (cleanupError) {
    console.error("Swole Cat cloud cleanup failed:", cleanupError);
    return json(500, { error: "Could not fully remove cloud account data." });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id, false);
  if (deleteError) {
    console.error("Swole Cat account deletion failed:", deleteError.message);
    return json(500, { error: "Could not delete the cloud account." });
  }

  return json(200, { ok: true });
});
