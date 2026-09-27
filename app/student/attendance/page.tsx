"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Row = { id: string; attendance_date: string; status: string; subject_id: string };
type Subject = { id: string; name: string };

export default function StudentAttendancePage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
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

      const { data } = await supabase
        .from("attendance")
        .select("id, attendance_date, status, subject_id")
        .eq("student_id", student.id)
        .order("attendance_date", { ascending: false });

      const attendance = data ?? [];
      setRows(attendance);

      const ids = [...new Set(attendance.map((item) => item.subject_id))];
      if (ids.length) {
        const { data: subjectRows } = await supabase.from("subjects").select("id, name").in("id", ids);
        const map: Record<string, string> = {};
        (subjectRows as Subject[] | null)?.forEach((subject) => { map[subject.id] = subject.name; });
        setSubjects(map);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const present = rows.filter((row) => row.status === "present" || row.status === "late").length;
  const percentage = rows.length ? Math.round((present / rows.length) * 100) : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white"><div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-4">
        <Link href="/student" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18} /></Link>
        <ClipboardCheck className="text-blue-700" />
        <h1 className="font-black text-[#102a43]">Attendance</h1>
      </div></header>
      <div className="mx-auto max-w-5xl px-5 py-8">
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-700" /></div> : (
          <>
            <section className="rounded-3xl bg-[#102a43] p-7 text-white">
              <p className="text-sm text-blue-200">Overall attendance</p>
              <p className="mt-2 text-4xl font-black">{percentage === null ? "—" : `${percentage}%`}</p>
              <p className="mt-2 text-sm text-slate-300">{rows.length ? `${present} present/late out of ${rows.length} recorded classes` : "No attendance records have been published yet."}</p>
            </section>
            <div className="mt-6 overflow-hidden rounded-2xl border bg-white">
              {rows.length ? <div className="divide-y">{rows.map((row) => (
                <div key={row.id} className="grid grid-cols-[1fr_auto] gap-4 px-5 py-4">
                  <div><p className="font-bold">{subjects[row.subject_id] ?? "Subject"}</p><p className="text-sm text-slate-500">{row.attendance_date}</p></div>
                  <span className="self-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize">{row.status}</span>
                </div>
              ))}</div> : <p className="p-8 text-center text-sm text-slate-500">No attendance records found.</p>}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
