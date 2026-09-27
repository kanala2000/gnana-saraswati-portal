"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Section = { id: string; name: string; year_level: number };
type Subject = { id: string; name: string };
type Assignment = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  section: { name: string } | null;
  subject: { name: string } | null;
};

export default function FacultyAssignments() {
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (facultyId: string) => {
    const [{ data: timetable }, { data: existing }] = await Promise.all([
      supabase.from("faculty_assignments").select("section_id, subject_id").eq("faculty_id", facultyId),
      supabase.from("assignments").select("id, title, description, due_date, section:sections(name), subject:subjects(name)").eq("faculty_id", facultyId).order("due_date"),
    ]);

    const sectionIds = [...new Set((timetable || []).map(x => x.section_id))];
    const subjectIds = [...new Set((timetable || []).map(x => x.subject_id))];

    if (sectionIds.length) {
      const { data } = await supabase.from("sections").select("id, name, year_level").in("id", sectionIds).order("name");
      setSections(data || []);
    } else setSections([]);

    if (subjectIds.length) {
      const { data } = await supabase.from("subjects").select("id, name").in("id", subjectIds).order("name");
      setSubjects(data || []);
    } else setSubjects([]);

    setAssignments((existing || []) as unknown as Assignment[]);
  };

  useEffect(() => {
    const start = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (!profile || profile.role !== "faculty") { await supabase.auth.signOut(); window.location.href = "/login"; return; }
      const { data: faculty } = await supabase.from("faculty").select("id").eq("profile_id", user.id).single();
      if (!faculty) { setLoading(false); return; }
      await load(faculty.id);
      setLoading(false);
    };
    start();
  }, []);

  const createAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!sectionId || !subjectId || !title.trim()) { setMessage("Select section, subject and enter a title."); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    const { data: faculty } = await supabase.from("faculty").select("id").eq("profile_id", user.id).single();
    if (!faculty) { setMessage("Faculty record not found."); return; }

    const { error } = await supabase.from("assignments").insert({
      faculty_id: faculty.id,
      section_id: sectionId,
      subject_id: subjectId,
      title: title.trim(),
      description: description.trim() || null,
      due_date: dueDate || null,
    });

    if (error) { setMessage(error.message); return; }
    setTitle(""); setDescription(""); setDueDate(""); setMessage("Assignment created successfully.");
    await load(faculty.id);
  };

  if (loading) return <main className="min-h-screen bg-slate-950 text-white p-8">Loading assignments...</main>;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <a href="/faculty" className="text-sm text-sky-400">← Faculty Dashboard</a>
        <h1 className="mt-3 text-3xl font-bold">Assignments</h1>
        <p className="mt-2 text-slate-400">Create assignments only for classes and subjects assigned to you.</p>

        <form onSubmit={createAssignment} className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 md:grid-cols-2">
          <select value={sectionId} onChange={e => setSectionId(e.target.value)} className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3">
            <option value="">Select section</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.name} • Year {s.year_level}</option>)}
          </select>
          <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3">
            <option value="">Select subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Assignment title" className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3" />
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Instructions / description" rows={4} className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3 md:col-span-2" />
          <div className="md:col-span-2">
            <button className="rounded-lg bg-sky-500 px-5 py-3 font-semibold text-slate-950 hover:bg-sky-400">Create Assignment</button>
            {message && <p className="mt-3 text-sm text-slate-300">{message}</p>}
          </div>
        </form>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">My Assignments</h2>
          <div className="mt-4 space-y-3">
            {assignments.map(a => (
              <div key={a.id} className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-col justify-between gap-2 md:flex-row">
                  <div>
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-sm text-slate-400">{a.subject?.name || "Subject"} • {a.section?.name || "Section"}</p>
                  </div>
                  {a.due_date && <span className="text-sm text-slate-300">Due {a.due_date}</span>}
                </div>
                {a.description && <p className="mt-3 text-sm text-slate-300">{a.description}</p>}
              </div>
            ))}
            {!assignments.length && <p className="text-slate-400">No assignments created yet.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
