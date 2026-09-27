"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Row = { id: string; attendance_date: string; status: string; subject_id: string };
type Subject = { id: string; name: string; code: string };

export default function StudentAttendancePage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.replace("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role,is_active").eq("id", session.user.id).single();
      if (!profile || profile.role !== "student" || profile.is_active === false) { await supabase.auth.signOut(); router.replace("/login"); return; }

      const { data: student } = await supabase.from("students").select("id").eq("profile_id", session.user.id).single();
      if (!student) { setLoading(false); return; }

      const { data } = await supabase.from("attendance").select("id,attendance_date,status,subject_id").eq("student_id", student.id).order("attendance_date", { ascending: false });
      const attendance = data ?? [];
      setRows(attendance);

      const ids = [...new Set(attendance.map(x => x.subject_id))];
      if (ids.length) {
        const { data: subjectRows } = await supabase.from("subjects").select("id,name,code").in("id", ids);
        const map: Record<string, Subject> = {};
        (subjectRows || []).forEach(s => { map[s.id] = s; });
        setSubjects(map);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const months = useMemo(() => [...new Set(rows.map(r => r.attendance_date.slice(0, 7)))], [rows]);
  const filtered = useMemo(() => rows.filter(r =>
    (subjectFilter === "all" || r.subject_id === subjectFilter) &&
    (monthFilter === "all" || r.attendance_date.slice(0, 7) === monthFilter)
  ), [rows, subjectFilter, monthFilter]);

  const present = filtered.filter(r => r.status === "present" || r.status === "late").length;
  const absent = filtered.filter(r => r.status === "absent").length;
  const percentage = filtered.length ? Math.round((present / filtered.length) * 100) : null;

  return <main className="min-h-screen bg-slate-50">
    <header className="border-b bg-white"><div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-4">
      <Link href="/student" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18}/></Link><ClipboardCheck className="text-blue-700"/><h1 className="font-black text-[#102a43]">Attendance</h1>
    </div></header>
    <div className="mx-auto max-w-5xl px-5 py-8">
      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-700"/></div> : <>
        <section className="rounded-3xl bg-[#102a43] p-7 text-white"><p className="text-sm text-blue-200">Attendance for selected period</p><p className="mt-2 text-4xl font-black">{percentage === null ? "—" : percentage + "%"}</p><p className="mt-2 text-sm text-slate-300">{filtered.length ? present + " present/late • " + absent + " absent • " + filtered.length + " records" : "No attendance records found."}</p></section>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} className="rounded-xl border bg-white px-4 py-3"><option value="all">All subjects</option>{Object.values(subjects).sort((a,b) => a.code.localeCompare(b.code)).map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}</select>
          <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="rounded-xl border bg-white px-4 py-3"><option value="all">All months</option>{months.map(m => <option key={m} value={m}>{m}</option>)}</select>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border bg-white">
          {filtered.length ? <div className="divide-y">{filtered.map(row => <div key={row.id} className="grid grid-cols-[1fr_auto] gap-4 px-5 py-4"><div><p className="font-bold">{subjects[row.subject_id]?.name || "Subject"}</p><p className="text-sm text-slate-500">{subjects[row.subject_id]?.code || ""} • {row.attendance_date}</p></div><span className="self-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize">{row.status}</span></div>)}</div> : <p className="p-8 text-center text-sm text-slate-500">No attendance records found.</p>}
        </div>
      </>}
    </div>
  </main>;
}