"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Slot = { id: string; subject_id: string; faculty_id: string | null; day_of_week: number; start_time: string; end_time: string; room: string | null };
type Named = { id: string; name: string };
type Faculty = { id: string; profile_id: string };

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function StudentTimetablePage() {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [subjects, setSubjects] = useState<Record<string, string>>({});
  const [faculty, setFaculty] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.replace("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (!profile || profile.role !== "student") { await supabase.auth.signOut(); router.replace("/login"); return; }
      const { data: student } = await supabase.from("students").select("section_id").eq("profile_id", session.user.id).single();
      if (!student) { setLoading(false); return; }

      const { data } = await supabase.from("timetables").select("id, subject_id, faculty_id, day_of_week, start_time, end_time, room").eq("section_id", student.section_id).order("day_of_week").order("start_time");
      const rows = data ?? [];
      setSlots(rows);

      const subjectIds = [...new Set(rows.map((x) => x.subject_id))];
      const facultyIds = [...new Set(rows.map((x) => x.faculty_id).filter(Boolean))] as string[];
      const [subjectResult, facultyResult] = await Promise.all([
        subjectIds.length ? supabase.from("subjects").select("id, name").in("id", subjectIds) : Promise.resolve({ data: [] as Named[] }),
        facultyIds.length ? supabase.from("faculty").select("id, profile_id").in("id", facultyIds) : Promise.resolve({ data: [] as Faculty[] }),
      ]);
      const sm: Record<string, string> = {}; const fm: Record<string, string> = {};
      (subjectResult.data as Named[] | null)?.forEach((x) => { sm[x.id] = x.name; });
      (facultyResult.data as Faculty[] | null)?.forEach((x) => { fm[x.id] = x.profile_id; });
      setSubjects(sm); setFaculty(fm); setLoading(false);
    }
    load();
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white"><div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-4"><Link href="/student" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18} /></Link><CalendarDays className="text-blue-700" /><h1 className="font-black text-[#102a43]">Timetable</h1></div></header>
      <div className="mx-auto max-w-5xl px-5 py-8">
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-700" /></div> : slots.length ? (
          <div className="space-y-5">{days.map((day, index) => {
            const daySlots = slots.filter((x) => x.day_of_week === index + 1);
            if (!daySlots.length) return null;
            return <section key={day} className="rounded-2xl border bg-white p-5"><h2 className="font-black text-[#102a43]">{day}</h2><div className="mt-3 divide-y">{daySlots.map((slot) => <div key={slot.id} className="grid gap-2 py-4 sm:grid-cols-[150px_1fr_auto] sm:items-center"><span className="text-sm font-bold text-slate-500">{slot.start_time.slice(0,5)} – {slot.end_time.slice(0,5)}</span><div><p className="font-bold">{subjects[slot.subject_id] ?? "Subject"}</p><p className="text-xs text-slate-500">{slot.room ? `Room: ${slot.room}` : "Room not specified"}</p></div><span className="text-xs text-slate-500">{slot.faculty_id ? "Faculty assigned" : "Faculty not assigned"}</span></div>)}</div></section>;
          })}</div>
        ) : <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">No timetable has been published for your section yet.</div>}
      </div>
    </main>
  );
}
