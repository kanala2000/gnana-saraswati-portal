import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const token = authHeader.slice(7);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: "Server Supabase configuration is incomplete." }, { status: 500 });

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: { user }, error: userError } = await admin.auth.getUser(token);
  if (userError || !user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

  const { data: actor } = await admin.from("profiles").select("role,college_id").eq("id", user.id).single();
  if (!actor || !["admin", "principal"].includes(actor.role) || !actor.college_id) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const body = await request.json();
  const required = ["email", "password", "full_name", "admission_number", "academic_year_id", "section_id"];
  for (const key of required) if (!body[key] || typeof body[key] !== "string") return NextResponse.json({ error: `${key.replaceAll("_", " ")} is required.` }, { status: 400 });

  const { data: section } = await admin.from("sections").select("id,college_id,academic_year_id").eq("id", body.section_id).single();
  if (!section || section.college_id !== actor.college_id || section.academic_year_id !== body.academic_year_id) return NextResponse.json({ error: "Selected section is not valid for this college and academic year." }, { status: 400 });

  const { data: year } = await admin.from("academic_years").select("id,college_id").eq("id", body.academic_year_id).single();
  if (!year || year.college_id !== actor.college_id) return NextResponse.json({ error: "Selected academic year is not valid." }, { status: 400 });

  const { data: existing } = await admin.from("students").select("id").eq("college_id", actor.college_id).eq("admission_number", body.admission_number).maybeSingle();
  if (existing) return NextResponse.json({ error: "Admission number already exists." }, { status: 409 });

  const { data: created, error: authError } = await admin.auth.admin.createUser({ email: body.email, password: body.password, email_confirm: true });
  if (authError || !created.user) return NextResponse.json({ error: authError?.message || "Could not create login account." }, { status: 400 });

  const authId = created.user.id;
  const { error: profileError } = await admin.from("profiles").insert({
    id: authId, college_id: actor.college_id, full_name: body.full_name, role: "student",
    phone: body.phone || null
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authId);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  const { error: studentError } = await admin.from("students").insert({
    profile_id: authId, college_id: actor.college_id, academic_year_id: body.academic_year_id,
    section_id: body.section_id, admission_number: body.admission_number, roll_number: body.roll_number || null,
    date_of_birth: body.date_of_birth || null, gender: body.gender || null,
    guardian_name: body.guardian_name || null, guardian_phone: body.guardian_phone || null,
    address: body.address || null, admission_date: body.admission_date || null, status: "active"
  });

  if (studentError) {
    await admin.from("profiles").delete().eq("id", authId);
    await admin.auth.admin.deleteUser(authId);
    return NextResponse.json({ error: studentError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, user_id: authId });
}
