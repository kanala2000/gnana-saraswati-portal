"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Student = {
  id: string;
  admission_number: string;
  roll_number: string | null;
  profile_id: string;
  section_id: string;
  profile?: { full_name: string } | null;
  section?: { name: string; year_level: number } | null;
};

export default function FacultyStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<{ id: string; name: string; year_level: number }[]>([]);
  const [sectionId, setSectionId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (!profile || profile.role !== "faculty") {
        await supabase.auth.signOut();
        window.location.href = "/login";
        return;
      }

      const { data: faculty } = await supabase.from("faculty").select("id").eq("profile_id", user.id).single();
      if (!faculty) { setLoading(false); return; }

      const { data: assignments } = await supabase.from("faculty_assignments").select("section_id").eq("faculty_id", faculty.id);
      const ids = [...new Set((assignments || []).map(x => x.section_id))];

      if (ids.length) {
        const [{ data: sectionRows }, { data: studentRows }] = await Promise.all([
          supabase.from("sections").select("id,name,year_level").in("id", ids).order("name"),
          supabase.from("students").select("id,admission_number,roll_number,profile_id,section_id").in("section_id", ids).eq("status", "active").order("admission_number")
        ]);

        setSections(sectionRows || []);
        const profileIds = [...new Set((studentRows || []).map(x => x.profile_id))];
        let names: Record<string, string> = {};
        if (profileIds.length) {
          const { data: profiles } = await supabase.from("profiles").select("id,full_name").in("id", profileIds);
          profiles?.forEach(p => { names[p.id] = p.full_name; });
        }

        setStudents((studentRows || []).map(s => ({
          ...s,
          profile: { full_name: names[s.profile_id] || "Student" },
          section: (sectionRows || []).find(sec => sec.id === s.section_id) || null
        })));
      }

      setLoading(false);
    };
    load();
  }, []);

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const matchesSection = !sectionId || s.section_id === sectionId;
    return matchesSection && (!q || (s.profile?.full_name || "").toLowerCase().includes(q) || s.admission_number.toLowerCase().includes(q) || (s.roll_number || "").toLowerCase().includes(q));
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <a href="/faculty" className="text-sm text-sky-400">← Faculty Dashboard</a>
        <h1 className="mt-3 text-3xl font-bold">My Students</h1>
        <p className="mt-2 text-slate-400">Students belonging to sections assigned to your faculty account.</p>

        <div className="mt-7 grid gap-3 md:grid-cols-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, admission or roll number" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none" />
          <select value={sectionId} onChange={e => setSectionId(e.target.value)} className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3">
            <option value="">All my sections</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.name} • Year {s.year_level}</option>)}
          </select>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {loading ? <p className="p-8 text-slate-400">Loading students...</p> :
            filtered.length ? filtered.map(s => (
              <div key={s.id} className="grid gap-2 border-b border-white/10 px-5 py-4 md:grid-cols-3">
                <div><p className="font-semibold">{s.profile?.full_name}</p><p className="text-xs text-slate-400">{s.admission_number}</p></div>
                <p className="text-sm text-slate-300">{s.roll_number ? "Roll No. " + s.roll_number : "Roll number not set"}</p>
                <p className="text-sm text-slate-400">{s.section?.name || "Section"} • Year {s.section?.year_level}</p>
              </div>
            )) : <p className="p-8 text-slate-400">No students found in your assigned sections.</p>}
        </div>
      </div>
    </main>
  );
}
