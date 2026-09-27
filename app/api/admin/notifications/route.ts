import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function getAdmin(request: Request) {
  const h = request.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { error: NextResponse.json({ error: "Server Supabase configuration is incomplete." }, { status: 500 }) };

  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: { user } } = await admin.auth.getUser(h.slice(7));
  if (!user) return { error: NextResponse.json({ error: "Invalid session." }, { status: 401 }) };

  const { data: actor } = await admin
    .from("profiles")
    .select("id,role,college_id,is_active")
    .eq("id", user.id)
    .single();

  if (!actor || !["admin", "principal"].includes(actor.role) || !actor.college_id || actor.is_active === false) {
    return { error: NextResponse.json({ error: "Not authorized." }, { status: 403 }) };
  }
  return { admin, actor };
}

export async function POST(request: Request) {
  const r = await getAdmin(request);
  if ("error" in r) return r.error;
  const { admin, actor } = r;
  const body = await request.json();

  const title = String(body.title ?? "").trim();
  const message = String(body.message ?? "").trim();
  const type = ["general","notice","attendance","marks","fees","assignment","timetable","system"].includes(body.notification_type)
    ? body.notification_type : "general";
  const audience = String(body.audience ?? "specific");
  const requestedIds = Array.isArray(body.recipient_profile_ids) ? body.recipient_profile_ids : [];

  if (!title || !message) return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
  if (title.length > 160 || message.length > 4000) return NextResponse.json({ error: "Notification is too long." }, { status: 400 });

  let recipientIds: string[] = [];
  if (audience === "students" || audience === "faculty" || audience === "all") {
    const roles = audience === "students" ? ["student"] : audience === "faculty" ? ["faculty"] : ["student", "faculty"];
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id")
      .eq("college_id", actor.college_id)
      .eq("is_active", true)
      .in("role", roles);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    recipientIds = (profiles ?? []).map(p => p.id);
  } else {
    recipientIds = requestedIds.filter((id: unknown): id is string => typeof id === "string");
  }

  recipientIds = [...new Set(recipientIds)];
  if (!recipientIds.length) return NextResponse.json({ error: "No active recipients selected." }, { status: 400 });
  if (recipientIds.length > 1000) return NextResponse.json({ error: "Please send to smaller groups of recipients." }, { status: 400 });

  const { data: validRecipients, error: recipientError } = await admin
    .from("profiles")
    .select("id")
    .eq("college_id", actor.college_id)
    .eq("is_active", true)
    .in("id", recipientIds);

  if (recipientError) return NextResponse.json({ error: recipientError.message }, { status: 400 });
  const validIds = (validRecipients ?? []).map(p => p.id);
  if (validIds.length !== recipientIds.length) return NextResponse.json({ error: "One or more recipients are invalid for this college." }, { status: 400 });

  const rows = validIds.map(recipient_profile_id => ({
    college_id: actor.college_id,
    recipient_profile_id,
    title,
    message,
    notification_type: type,
    created_by: actor.id,
  }));

  const { error } = await admin.from("notifications").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true, sent: rows.length });
}
