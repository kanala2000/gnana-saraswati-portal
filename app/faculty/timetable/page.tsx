"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Row = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_number: string | null;
  subject: { name: string } | null;
  section: { name: string; year_level: number } | null;
};

const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

export default function FacultyTimetable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (!profile || profile.role !== "faculty") { await supabase.auth.signOut(); window.location.href = "/login"; return; }

      const { data: faculty } = await supabase.from("faculty").select("id").eq("profile_id", user.id).single();
      if (!faculty) { setLoading(false); return; }

      const { data } = await supabase
        .from("timetables")
        .select("id, day_of_week, start_time, end_time, room_number, subject:subjects(name), section:sections(name, year_level)")
        .eq("faculty_id", faculty.id)
        .order("day_of_week")
        .order("start_time");

      setRows((data || []) as unknown as Row[]);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <main className="min-h-screen bg-slate-950 text-white p-8">Loading timetable...</main>;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <a href="/faculty" className="text-sm text-sky-400">← Faculty Dashboard</a>
        <h1 className="mt-3 text-3xl font-bold">My Timetable</h1>
        <p className="mt-2 text-slate-400">Periods assigned to your faculty account.</p>

        <div className="mt-8 space-y-6">
          {days.map((day, index) => {
            const dayRows = rows.filter(r => r.day_of_week === index + 1);
            if (!dayRows.length) return null;
            return (
              <section key={day}>
                <h2 className="mb-3 text-lg font-semibold">{day}</h2>
                <div className="space-y-3">
                  {dayRows.map(row => (
                    <div key={row.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-col justify-between gap-2 md:flex-row">
                        <div>
                          <p className="font-semibold">{row.subject?.name || "Subject"}</p>
                          <p className="text-sm text-slate-400">
                            {row.section?.name || "Section"} {row.section?.year_level ? "• Year " + row.section.year_level : ""}
                          </p>
                        </div>
                        <div className="text-sm text-slate-300">
                          {row.start_time} - {row.end_time}{row.room_number ? " • Room " + row.room_number : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
          {!rows.length && <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-slate-400">No timetable entries are assigned yet.</div>}
        </div>
      </div>
    </main>
  );
}
