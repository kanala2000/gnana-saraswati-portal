"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Section = { id: string; name: string; year_level: number };
type Subject = { id: string; name: string; code: string; max_marks: number | null };
type Exam = { id: string; name: string; exam_date: string | null };
type Student = { id: string; admission_number: string; profile_id: string };

export default function FacultyMarksPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<{section_id:string;subject_id:string}[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [examId, setExamId] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const { data: profile } = await supabase.from("profiles").select("role,college_id,is_active").eq("id", user.id).single();
      if (!profile || profile.role !== "faculty" || profile.is_active === false) { await supabase.auth.signOut(); window.location.href = "/login"; return; }

      const { data: faculty } = await supabase.from("faculty").select("id").eq("profile_id", user.id).single();
      if (!faculty) { setLoading(false); return; }

      const { data: assignments } = await supabase.from("faculty_assignments").select("section_id,subject_id").eq("faculty_id", faculty.id);
      const sectionIds = [...new Set((assignments || []).map(x => x.section_id))];
      const subjectIds = [...new Set((assignments || []).map(x => x.subject_id))];

      if (sectionIds.length) {
        const { data } = await supabase.from("sections").select("id,name,year_level").in("id", sectionIds).order("name");
        setSections(data || []);
      }
      if (subjectIds.length) {
        const { data } = await supabase.from("subjects").select("id,name,code,max_marks").in("id", subjectIds).order("code");
        setSubjects(data || []);
        setAssignments(assignments || []);
      }
      if (profile.college_id) {
        const { data } = await supabase.from("exams").select("id,name,exam_date").eq("college_id", profile.college_id).order("exam_date", { ascending: false });
        setExams(data || []);
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
      if (!examId || !subjectId || !students.length) { setValues({}); return; }
      const { data } = await supabase.from("marks").select("student_id,marks").eq("exam_id", examId).eq("subject_id", subjectId).in("student_id", students.map(s => s.id));
      const map: Record<string, string> = {};
      data?.forEach(x => { map[x.student_id] = String(x.marks); });
      setValues(map);
    };
    loadExisting();
  }, [examId, subjectId, students]);

  const save = async () => {
    const subject = subjects.find(s => s.id === subjectId);
    const max = subject?.max_marks ?? 0;
    if (!sectionId || !subjectId || !examId) { setMessage("Select section, subject and exam."); return; }
    if (!assignments.some(a => a.section_id === sectionId && a.subject_id === subjectId)) { setMessage("This section and subject are not assigned to you."); return; }
    if (!max) { setMessage("Set max marks for this subject before entering marks."); return; }

    const rows = students.filter(s => values[s.id] !== undefined && values[s.id] !== "").map(s => ({
      exam_id: examId,
      student_id: s.id,
      subject_id: subjectId,
      marks: Number(values[s.id]),
      max_marks: max
    }));

    if (!rows.length) { setMessage("Enter at least one mark."); return; }
    if (rows.some(r => !Number.isFinite(r.marks) || r.marks < 0 || r.marks > max)) {
      setMessage("Marks must be between 0 and " + max + ".");
      return;
    }

    setSaving(true); setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    const payload = rows.map(r => ({ ...r, entered_by: user?.id }));
    const { error } = await supabase.from("marks").upsert(payload, { onConflict: "exam_id,student_id,subject_id" });
    setMessage(error ? "Error: " + error.message : "Marks saved successfully.");
    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <a href="/faculty" className="text-sm text-sky-400">← Faculty Dashboard</a>
        <h1 className="mt-3 text-3xl font-bold">Marks</h1>
        <p className="mt-2 text-slate-400">Enter marks for your assigned teaching sections and subjects.</p>

        <div className="mt-7 grid gap-3 md:grid-cols-3">
          <select value={sectionId} onChange={e => setSectionId(e.target.value)} className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3">
            <option value="">Select section</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.name} • Year {s.year_level}</option>)}
          </select>
          <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3">
            <option value="">Select subject</option>
            {subjects.filter(s => assignments.some(a => a.section_id === sectionId && a.subject_id === s.id)).map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}{s.max_marks ? " (Max " + s.max_marks + ")" : ""}</option>)}
          </select>
          <select value={examId} onChange={e => setExamId(e.target.value)} className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3">
            <option value="">Select exam</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name}{e.exam_date ? " — " + e.exam_date : ""}</option>)}
          </select>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {loading ? <p className="p-8 text-slate-400">Loading...</p> :
            !sectionId ? <p className="p-8 text-slate-400">Select a section to load students.</p> :
            students.map(s => (
              <div key={s.id} className="grid grid-cols-[1fr_120px] items-center gap-4 border-b border-white/10 px-5 py-4">
                <div><p className="font-semibold">{names[s.profile_id] || "Student"}</p><p className="text-xs text-slate-400">{s.admission_number}</p></div>
                <input type="number" min="0" max={subjects.find(x => x.id === subjectId)?.max_marks ?? undefined} step="0.01" value={values[s.id] || ""} onChange={e => setValues(v => ({ ...v, [s.id]: e.target.value }))} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-right" />
              </div>
            ))}
          {!loading && sectionId && !students.length && <p className="p-8 text-slate-400">No active students in this section.</p>}
        </div>

        {message && <p className="mt-4 text-sm text-slate-300">{message}</p>}
        <button onClick={save} disabled={saving || loading || !sectionId || !subjectId || !examId} className="mt-5 rounded-xl bg-sky-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50">
          {saving ? "Saving..." : "Save Marks"}
        </button>
      </div>
    </main>
  );
}
