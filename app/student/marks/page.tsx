"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Mark = { id: string; marks: number; max_marks: number; exam_id: string; subject_id: string };
type Exam = { id: string; name: string; exam_date: string | null };
type Subject = { id: string; name: string; code: string };

export default function StudentMarksPage() {
  const router = useRouter();
  const [marks, setMarks] = useState<Mark[]>([]);
  const [exams, setExams] = useState<Record<string, Exam>>({});
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});
  const [loading, setLoading] = useState(true);
  const [examFilter, setExamFilter] = useState("all");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.replace("/login"); return; }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (!profile || profile.role !== "student") { await supabase.auth.signOut(); router.replace("/login"); return; }

      const { data: student } = await supabase.from("students").select("id").eq("profile_id", session.user.id).single();
      if (!student) { setLoading(false); return; }

      const { data } = await supabase.from("marks").select("id,marks,max_marks,exam_id,subject_id").eq("student_id", student.id);
      const rows = data ?? [];
      setMarks(rows);

      const examIds = [...new Set(rows.map(r => r.exam_id))];
      const subjectIds = [...new Set(rows.map(r => r.subject_id))];
      const [examResult, subjectResult] = await Promise.all([
        examIds.length ? supabase.from("exams").select("id,name,exam_date").in("id", examIds) : Promise.resolve({ data: [] as Exam[] }),
        subjectIds.length ? supabase.from("subjects").select("id,name,code").in("id", subjectIds) : Promise.resolve({ data: [] as Subject[] }),
      ]);
      const examMap: Record<string, Exam> = {}, subjectMap: Record<string, Subject> = {};
      (examResult.data || []).forEach(x => { examMap[x.id] = x; });
      (subjectResult.data || []).forEach(x => { subjectMap[x.id] = x; });
      setExams(examMap); setSubjects(subjectMap); setLoading(false);
    }
    load();
  }, [router]);

  const filtered = useMemo(() => examFilter === "all" ? marks : marks.filter(m => m.exam_id === examFilter), [marks, examFilter]);
  const totalMarks = filtered.reduce((s, m) => s + Number(m.marks), 0);
  const totalMax = filtered.reduce((s, m) => s + Number(m.max_marks), 0);
  const overallPct = totalMax ? Math.round((totalMarks / totalMax) * 100) : null;
  const examOptions = Object.values(exams).sort((a,b) => (b.exam_date || "").localeCompare(a.exam_date || ""));

  return <main className="min-h-screen bg-slate-50">
    <header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4">
      <Link href="/student" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18}/></Link><BookOpen className="text-blue-700"/><h1 className="font-black text-[#102a43]">Marks & Exams</h1>
    </div></header>
    <div className="mx-auto max-w-6xl px-5 py-8">
      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-700"/></div> : <>
        <section className="rounded-3xl bg-[#102a43] p-7 text-white">
          <p className="text-sm text-blue-200">Academic performance</p>
          <p className="mt-2 text-4xl font-black">{overallPct === null ? "—" : overallPct + "%"}</p>
          <p className="mt-2 text-sm text-slate-300">{filtered.length ? totalMarks + " / " + totalMax + " marks across " + filtered.length + " subjects" : "No examination results have been published yet."}</p>
        </section>
        <div className="mt-6">
          <select value={examFilter} onChange={e => setExamFilter(e.target.value)} className="w-full rounded-xl border bg-white px-4 py-3 sm:w-96">
            <option value="all">All examinations</option>
            {examOptions.map(e => <option key={e.id} value={e.id}>{e.name}{e.exam_date ? " — " + e.exam_date : ""}</option>)}
          </select>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border bg-white">
          {filtered.length ? <div className="divide-y">{filtered.map(row => {
            const pct = row.max_marks ? Math.round((Number(row.marks) / Number(row.max_marks)) * 100) : 0;
            return <div key={row.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1.4fr_1fr_auto_auto] sm:items-center">
              <div><p className="font-bold text-[#102a43]">{exams[row.exam_id]?.name || "Exam"}</p><p className="text-xs text-slate-500">{exams[row.exam_id]?.exam_date || ""}</p></div>
              <p><span className="font-semibold">{subjects[row.subject_id]?.name || "Subject"}</span><span className="ml-2 text-xs text-slate-500">{subjects[row.subject_id]?.code || ""}</span></p>
              <p className="font-bold">{row.marks} / {row.max_marks}</p><p className="font-black text-blue-700">{pct}%</p>
            </div>;
          })}</div> : <p className="p-10 text-center text-sm text-slate-500">No results found for this examination.</p>}
        </div>
      </>}
    </div>
  </main>;
}