"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Slot = { id: string; subject_id: string; faculty_id: string | null; day_of_week: number; start_time: string; end_time: string; room: string | null };
type Subject = { id: string; name: string; code: string };
type Faculty = { id: string; profile_id: string };
type Profile = { id: string; full_name: string };

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function StudentTimetablePage() {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});
  const [facultyNames, setFacultyNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState("all");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.replace("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (!profile || profile.role !== "student") { await supabase.auth.signOut(); router.replace("/login"); return; }

      const { data: student } = await supabase.from("students").select("section_id").eq("profile_id", session.user.id).single();
      if (!student) { setLoading(false); return; }

      const { data } = await supabase.from("timetables").select("id,subject_id,faculty_id,day_of_week,start_time,end_time,room").eq("section_id", student.section_id).order("day_of_week").order("start_time");
      const rows = data ?? [];
      setSlots(rows);

      const subjectIds = [...new Set(rows.map(x => x.subject_id))];
      const facultyIds = [...new Set(rows.map(x => x.faculty_id).filter(Boolean))] as string[];
      const [subjectResult, facultyResult] = await Promise.all([
        subjectIds.length ? supabase.from("subjects").select("id,name,code").in("id", subjectIds) : Promise.resolve({ data: [] as Subject[] }),
        facultyIds.length ? supabase.from("faculty").select("id,profile_id").in("id", facultyIds) : Promise.resolve({ data: [] as Faculty[] }),
      ]);

      const sm: Record<string, Subject> = {};
      (subjectResult.data || []).forEach(x => { sm[x.id] = x; });
      setSubjects(sm);

      const facultyRows = facultyResult.data || [];
      const profileIds = facultyRows.map(x => x.profile_id);
      const { data: profileRows } = profileIds.length ? await supabase.from("profiles").select("id,full_name").in("id", profileIds) : { data: [] as Profile[] };
      const pm: Record<string, string> = {};
      const profileMap: Record<string, string> = {};
      (profileRows || []).forEach(x => { profileMap[x.id] = x.full_name; });
      facultyRows.forEach(x => { pm[x.id] = profileMap[x.profile_id] || "Faculty"; });
      setFacultyNames(pm);
      setLoading(false);
    }
    load();
  }, [router]);

  const visibleDays = useMemo(() => dayFilter === "all" ? days : days.filter(d => d === dayFilter), [dayFilter]);

  return <main className="min-h-screen bg-slate-50">
    <header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4"><Link href="/student" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18}/></Link><CalendarDays className="text-blue-700"/><h1 className="font-black text-[#102a43]">Timetable</h1></div></header>
    <div className="mx-auto max-w-6xl px-5 py-8">
      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-700"/></div> : <>
        <div className="mb-6 flex gap-3 overflow-x-auto pb-1"><button onClick={() => setDayFilter("all")} className={`rounded-full px-4 py-2 text-sm font-bold ${dayFilter === "all" ? "bg-[#102a43] text-white" : "bg-white text-slate-600 border"}`}>All Days</button>{days.map(day => <button key={day} onClick={() => setDayFilter(day)} className={`rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap ${dayFilter === day ? "bg-[#102a43] text-white" : "bg-white text-slate-600 border"}`}>{day}</button>)}</div>
        {slots.length ? <div className="space-y-5">{visibleDays.map(day => {
          const daySlots = slots.filter(x => x.day_of_week === days.indexOf(day) + 1);
          if (!daySlots.length) return null;
          return <section key={day} className="overflow-hidden rounded-2xl border bg-white"><div className="border-b bg-slate-50 px-5 py-4"><h2 className="font-black text-[#102a43]">{day}</h2></div><div className="divide-y">{daySlots.map(slot => <div key={slot.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[150px_1fr_180px] sm:items-center"><div><p className="font-bold text-[#102a43]">{slot.start_time.slice(0,5)} – {slot.end_time.slice(0,5)}</p><p className="text-xs text-slate-500">Class period</p></div><div><p className="font-bold">{subjects[slot.subject_id]?.name || "Subject"}</p><p className="text-xs text-slate-500">{subjects[slot.subject_id]?.code || ""}{slot.room ? " • Room: " + slot.room : ""}</p></div><p className="text-sm text-slate-500 sm:text-right">{slot.faculty_id ? facultyNames[slot.faculty_id] || "Faculty assigned" : "Faculty not assigned"}</p></div>)}</div></section>;
        })}</div> : <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">No timetable has been published for your section yet.</div>}
      </>}
    </div>
  </main>;
}