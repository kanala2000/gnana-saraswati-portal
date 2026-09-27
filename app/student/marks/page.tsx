"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Mark = { id: string; marks: number; max_marks: number; exam_id: string; subject_id: string };
type Named = { id: string; name: string };

export default function StudentMarksPage() {
  const router = useRouter();
  const [marks, setMarks] = useState<Mark[]>([]);
  const [exams, setExams] = useState<Record<string, string>>({});
  const [subjects, setSubjects] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.replace("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (!profile || profile.role !== "student") { await supabase.auth.signOut(); router.replace("/login"); return; }
      const { data: student } = await supabase.from("students").select("id").eq("profile_id", session.user.id).single();
      if (!student) { setLoading(false); return; }

      const { data } = await supabase.from("marks").select("id, marks, max_marks, exam_id, subject_id").eq("student_id", student.id);
      const rows = data ?? [];
      setMarks(rows);

      const examIds = [...new Set(rows.map((row) => row.exam_id))];
      const subjectIds = [...new Set(rows.map((row) => row.subject_id))];
      const [examResult, subjectResult] = await Promise.all([
        examIds.length ? supabase.from("exams").select("id, name").in("id", examIds) : Promise.resolve({ data: [] as Named[] }),
        subjectIds.length ? supabase.from("subjects").select("id, name").in("id", subjectIds) : Promise.resolve({ data: [] as Named[] }),
      ]);
      const examMap: Record<string, string> = {};
      const subjectMap: Record<string, string> = {};
      (examResult.data as Named[] | null)?.forEach((x) => { examMap[x.id] = x.name; });
      (subjectResult.data as Named[] | null)?.forEach((x) => { subjectMap[x.id] = x.name; });
      setExams(examMap); setSubjects(subjectMap); setLoading(false);
    }
    load();
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white"><div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-4">
        <Link href="/student" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18} /></Link><BookOpen className="text-blue-700" /><h1 className="font-black text-[#102a43]">Marks & Exams</h1>
      </div></header>
      <div className="mx-auto max-w-5xl px-5 py-8">
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-700" /></div> : marks.length ? (
          <div className="overflow-hidden rounded-2xl border bg-white">
            <div className="grid grid-cols-4 gap-3 border-b bg-slate-50 px-5 py-3 text-xs font-black uppercase text-slate-500"><span>Exam</span><span>Subject</span><span>Marks</span><span>Percentage</span></div>
            {marks.map((row) => {
              const pct = row.max_marks ? Math.round((Number(row.marks) / Number(row.max_marks)) * 100) : 0;
              return <div key={row.id} className="grid grid-cols-4 gap-3 border-b px-5 py-4 text-sm"><span className="font-bold">{exams[row.exam_id] ?? "Exam"}</span><span>{subjects[row.subject_id] ?? "Subject"}</span><span>{row.marks} / {row.max_marks}</span><span className="font-bold">{pct}%</span></div>;
            })}
          </div>
        ) : <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">No examination results have been published yet.</div>}
      </div>
    </main>
  );
}
