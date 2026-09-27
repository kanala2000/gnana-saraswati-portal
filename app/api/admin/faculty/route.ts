import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Server Supabase configuration is incomplete." }, { status: 500 });
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: { user } } = await admin.auth.getUser(auth.slice(7));
  if (!user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

  const { data: actor } = await admin.from("profiles").select("role,college_id").eq("id", user.id).single();
  if (!actor || !["admin", "principal"].includes(actor.role) || !actor.college_id) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const body = await request.json();
  for (const key of ["email","password","full_name","employee_number"]) {
    if (!body[key] || typeof body[key] !== "string") return NextResponse.json({ error: key.replaceAll("_"," ") + " is required." }, { status: 400 });
  }

  const { data: duplicate } = await admin.from("faculty").select("id").eq("college_id", actor.college_id).eq("employee_number", body.employee_number).maybeSingle();
  if (duplicate) return NextResponse.json({ error: "Employee number already exists." }, { status: 409 });

  const { data: created, error: authError } = await admin.auth.admin.createUser({ email: body.email, password: body.password, email_confirm: true });
  if (authError || !created.user) return NextResponse.json({ error: authError?.message || "Could not create login account." }, { status: 400 });

  const authId = created.user.id;
  const { error: profileError } = await admin.from("profiles").insert({
    id: authId, college_id: actor.college_id, full_name: body.full_name, role: "faculty", phone: body.phone || null
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(authId);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  const { error: facultyError } = await admin.from("faculty").insert({
    profile_id: authId, college_id: actor.college_id, employee_number: body.employee_number,
    designation: body.designation || null, department: body.department || null,
    joining_date: body.joining_date || null, status: "active"
  });
  if (facultyError) {
    await admin.from("profiles").delete().eq("id", authId);
    await admin.auth.admin.deleteUser(authId);
    return NextResponse.json({ error: facultyError.message }, { status: 400 });
  }
  return NextResponse.json({ success: true, user_id: authId });
}
