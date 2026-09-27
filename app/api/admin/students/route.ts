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
  const { data: actor } = await admin.from("profiles").select("role,college_id").eq("id", user.id).single();
  if (!actor || !["admin", "principal"].includes(actor.role) || !actor.college_id) return { error: NextResponse.json({ error: "Not authorized." }, { status: 403 }) };
  return { admin, actor };
}

export async function PATCH(request: Request) {
  const r = await getAdmin(request);
  if ("error" in r) return r.error;
  const { admin, actor } = r;
  const b = await request.json();
  if (!b.id) return NextResponse.json({ error: "Student id is required." }, { status: 400 });

  const { data: student } = await admin.from("students")
    .select("id,profile_id,college_id")
    .eq("id", b.id).single();
  if (!student || student.college_id !== actor.college_id) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  if (!b.academic_year_id || !b.section_id) {
    return NextResponse.json({ error: "Academic year and section are required." }, { status: 400 });
  }

  const { data: section } = await admin.from("sections")
    .select("id,academic_year_id,course_id,college_id")
    .eq("id", b.section_id).single();
  if (!section || section.college_id !== actor.college_id || section.academic_year_id !== b.academic_year_id) {
    return NextResponse.json({ error: "Selected section does not belong to the selected academic year." }, { status: 400 });
  }

  const { data: year } = await admin.from("academic_years")
    .select("id,college_id").eq("id", b.academic_year_id).single();
  if (!year || year.college_id !== actor.college_id) {
    return NextResponse.json({ error: "Selected academic year is invalid." }, { status: 400 });
  }

  const status = ["active", "inactive", "passed_out", "left"].includes(b.status) ? b.status : "active";
  const { error } = await admin.from("students").update({
    roll_number: b.roll_number ?? null,
    academic_year_id: b.academic_year_id,
    section_id: b.section_id,
    status
  }).eq("id", student.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { error: pe } = await admin.from("profiles").update({
    is_active: status === "active"
  }).eq("id", student.profile_id);
  if (pe) return NextResponse.json({ error: pe.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
