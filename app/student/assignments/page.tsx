"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Assignment = { id: string; title: string; description: string | null; due_date: string | null; subject_id: string };
type Subject = { id: string; name: string };

export default function StudentAssignmentsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.replace("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (!profile || profile.role !== "student") { await supabase.auth.signOut(); router.replace("/login"); return; }
      const { data: student } = await supabase.from("students").select("section_id").eq("profile_id", session.user.id).single();
      if (!student) { setLoading(false); return; }

      const { data } = await supabase.from("assignments").select("id, title, description, due_date, subject_id").eq("section_id", student.section_id).order("due_date", { ascending: true });
      const rows = data ?? [];
      setRows(rows);
      const ids = [...new Set(rows.map((x) => x.subject_id))];
      if (ids.length) {
        const { data: subjectRows } = await supabase.from("subjects").select("id, name").in("id", ids);
        const map: Record<string, string> = {};
        (subjectRows as Subject[] | null)?.forEach((x) => { map[x.id] = x.name; });
        setSubjects(map);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white"><div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-4"><Link href="/student" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18} /></Link><BookOpen className="text-blue-700" /><h1 className="font-black text-[#102a43]">Assignments</h1></div></header>
      <div className="mx-auto max-w-5xl px-5 py-8">
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-700" /></div> : rows.length ? <div className="grid gap-4">{rows.map((row) => <article key={row.id} className="rounded-2xl border bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">{subjects[row.subject_id] ?? "Subject"}</p><h2 className="mt-1 text-xl font-black text-[#102a43]">{row.title}</h2></div><p className="text-xs font-bold text-slate-500">{row.due_date ? new Date(row.due_date).toLocaleString() : "No due date"}</p></div>{row.description && <p className="mt-4 leading-7 text-slate-600">{row.description}</p>}</article>)}</div> : <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">No assignments have been published for your section.</div>}
      </div>
    </main>
  );
}
