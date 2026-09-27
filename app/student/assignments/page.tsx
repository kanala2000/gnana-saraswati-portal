"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Loader2, Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Assignment = { id: string; title: string; description: string | null; due_date: string | null; attachment_url: string | null; subject_id: string };
type Subject = { id: string; name: string; code: string };

export default function StudentAssignmentsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.replace("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (!profile || profile.role !== "student") { await supabase.auth.signOut(); router.replace("/login"); return; }

      const { data: student } = await supabase.from("students").select("section_id").eq("profile_id", session.user.id).single();
      if (!student) { setLoading(false); return; }

      const { data } = await supabase.from("assignments").select("id,title,description,due_date,attachment_url,subject_id").eq("section_id", student.section_id).order("due_date", { ascending: true, nullsFirst: false });
      const assignments = data ?? [];
      setRows(assignments);

      const ids = [...new Set(assignments.map(x => x.subject_id))];
      if (ids.length) {
        const { data: subjectRows } = await supabase.from("subjects").select("id,name,code").in("id", ids);
        const map: Record<string, Subject> = {};
        (subjectRows || []).forEach(x => { map[x.id] = x; });
        setSubjects(map);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const subjectsList = useMemo(() => Object.values(subjects).sort((a,b) => a.code.localeCompare(b.code)), [subjects]);
  const filtered = filter === "all" ? rows : rows.filter(r => r.subject_id === filter);
  const now = Date.now();
  const pending = filtered.filter(r => !r.due_date || new Date(r.due_date).getTime() >= now).length;
  const overdue = filtered.filter(r => r.due_date && new Date(r.due_date).getTime() < now).length;

  return <main className="min-h-screen bg-slate-50">
    <header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4"><Link href="/student" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18}/></Link><BookOpen className="text-blue-700"/><h1 className="font-black text-[#102a43]">Assignments</h1></div></header>
    <div className="mx-auto max-w-6xl px-5 py-8">
      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-700"/></div> : <>
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Total</p><p className="mt-1 text-3xl font-black text-[#102a43]">{filtered.length}</p></div>
          <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Upcoming</p><p className="mt-1 text-3xl font-black text-blue-700">{pending}</p></div>
          <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Overdue</p><p className="mt-1 text-3xl font-black text-red-600">{overdue}</p></div>
        </section>
        <div className="mt-6"><select value={filter} onChange={e => setFilter(e.target.value)} className="w-full rounded-xl border bg-white px-4 py-3 sm:w-96"><option value="all">All subjects</option>{subjectsList.map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}</select></div>
        <div className="mt-6 grid gap-4">{filtered.length ? filtered.map(row => {
          const isOverdue = !!row.due_date && new Date(row.due_date).getTime() < now;
          return <article key={row.id} className="rounded-2xl border bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">{subjects[row.subject_id]?.code || ""} • {subjects[row.subject_id]?.name || "Subject"}</p><h2 className="mt-1 text-xl font-black text-[#102a43]">{row.title}</h2></div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${isOverdue ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{isOverdue ? "Overdue" : "Upcoming"}</span>
            </div>
            {row.description && <p className="mt-4 leading-7 text-slate-600">{row.description}</p>}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-sm font-semibold text-slate-500">{row.due_date ? "Due: " + new Date(row.due_date).toLocaleString() : "No due date"}</p>{row.attachment_url && <a href={row.attachment_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold text-blue-700 hover:bg-slate-50"><Paperclip size={16}/>Open attachment</a>}</div>
          </article>;
        }) : <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">No assignments have been published for your section.</div>}</div>
      </>}
    </div>
  </main>;
}