"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Section = { id: string; name: string; year_level: number };
type Subject = { id: string; name: string; code: string };
type Student = { id: string; admission_number: string; profile_id: string };
type Status = "present" | "absent" | "late" | "excused";

export default function FacultyAttendancePage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<Record<string, Status | "">>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (!profile || profile.role !== "faculty") { await supabase.auth.signOut(); window.location.href = "/login"; return; }

      const { data: faculty } = await supabase.from("faculty").select("id").eq("profile_id", user.id).single();
      if (!faculty) { setLoading(false); return; }

      const { data: timetable } = await supabase.from("timetables").select("section_id,subject_id").eq("faculty_id", faculty.id);
      const sectionIds = [...new Set((timetable || []).map(x => x.section_id))];
      const subjectIds = [...new Set((timetable || []).map(x => x.subject_id))];

      if (sectionIds.length) {
        const { data } = await supabase.from("sections").select("id,name,year_level").in("id", sectionIds).order("name");
        setSections(data || []);
      }
      if (subjectIds.length) {
        const { data } = await supabase.from("subjects").select("id,name,code").in("id", subjectIds).order("code");
        setSubjects(data || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const loadStudents = async () => {
      if (!sectionId) { setStudents([]); return; }
      const { data } = await supabase.from("students").select("id,admission_number,profile_id").eq("section_id", sectionId).eq("status", "active").order("admission_number");
      const rows = data || [];
      setStudents(rows);
      const ids = rows.map(x => x.profile_id);
      if (ids.length) {
        const { data: profiles } = await supabase.from("profiles").select("id,full_name").in("id", ids);
        const map: Record<string, string> = {};
        profiles?.forEach(p => { map[p.id] = p.full_name; });
        setNames(map);
      } else setNames({});
    };
    loadStudents();
  }, [sectionId]);

  useEffect(() => {
    const loadExisting = async () => {
      if (!sectionId || !subjectId || !date || !students.length) { setStatus({}); return; }
      const { data } = await supabase.from("attendance").select("student_id,status").eq("subject_id", subjectId).eq("attendance_date", date).in("student_id", students.map(s => s.id));
      const map: Record<string, Status> = {};
      data?.forEach(x => { map[x.student_id] = x.status as Status; });
      setStatus(map);
    };
    loadExisting();
  }, [sectionId, subjectId, date, students]);

  const save = async () => {
    if (!sectionId || !subjectId || !date) { setMessage("Select section, subject and date."); return; }
    const marked = students.filter(s => status[s.id]);
    if (!marked.length) { setMessage("Mark at least one student."); return; }
    setSaving(true); setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    const rows = marked.map(s => ({ student_id: s.id, subject_id: subjectId, attendance_date: date, status: status[s.id], marked_by: user?.id }));
    const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "student_id,subject_id,attendance_date" });
    setMessage(error ? "Error: " + error.message : "Attendance saved successfully.");
    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <a href="/faculty" className="text-sm text-sky-400">← Faculty Dashboard</a>
        <h1 className="mt-3 text-3xl font-bold">Attendance</h1>
        <p className="mt-2 text-slate-400">Attendance entry is limited to your assigned teaching sections and subjects.</p>

        <div className="mt-7 grid gap-3 md:grid-cols-3">
          <select value={sectionId} onChange={e => setSectionId(e.target.value)} className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3">
            <option value="">Select section</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.name} • Year {s.year_level}</option>)}
          </select>
          <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3">
            <option value="">Select subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
          </select>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3" />
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {loading ? <p className="p-8 text-slate-400">Loading...</p> :
            !sectionId ? <p className="p-8 text-slate-400">Select a section to load students.</p> :
            students.map(s => (
              <div key={s.id} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-white/10 px-5 py-4">
                <div><p className="font-semibold">{names[s.profile_id] || "Student"}</p><p className="text-xs text-slate-400">{s.admission_number}</p></div>
                <select value={status[s.id] || ""} onChange={e => setStatus(v => ({ ...v, [s.id]: e.target.value as Status }))} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm">
                  <option value="">Not marked</option><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option><option value="excused">Excused</option>
                </select>
              </div>
            ))}
          {!loading && sectionId && !students.length && <p className="p-8 text-slate-400">No active students in this section.</p>}
        </div>

        {message && <p className="mt-4 text-sm text-slate-300">{message}</p>}
        <button onClick={save} disabled={saving || loading || !sectionId || !subjectId} className="mt-5 rounded-xl bg-sky-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50">
          {saving ? "Saving..." : "Save Attendance"}
        </button>
      </div>
    </main>
  );
}
