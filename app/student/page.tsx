"use client";

import { useEffect, useState } from "react";
import { GraduationCap, LogOut, CalendarDays, ClipboardCheck, BookOpen, Bell, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function StudentDashboard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [studentName, setStudentName] = useState("Demo Student");
  const [studentId, setStudentId] = useState("GSJC001");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, student_id, role")
        .eq("id", session.user.id)
        .single();

      if (!profile || profile.role !== "student") {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      setStudentName(profile.full_name);
      setStudentId(profile.student_id || "—");
      setChecking(false);
    }

    loadProfile();
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
          <Loader2 className="animate-spin" size={20} /> Loading portal...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#102a43] text-white"><GraduationCap size={22} /></div>
            <div>
              <p className="text-sm font-extrabold text-blue-700">GNANA SARASWATI JR. COLLEGE</p>
              <p className="text-xs text-slate-500">Student Portal • Bethamcherla</p>
            </div>
          </div>
          <button onClick={handleLogout} disabled={loggingOut} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60">
            <LogOut size={16} /> {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8">
        <div className="rounded-3xl bg-[#102a43] p-7 text-white">
          <p className="text-sm font-semibold text-blue-200">Welcome back</p>
          <h1 className="mt-1 text-3xl font-black">{studentName} 👋</h1>
          <p className="mt-2 text-sm text-slate-300">Student ID: {studentId} • First Year MPC</p>
        </div>

        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Attendance", "92%", "Good attendance", ClipboardCheck],
            ["Internal Marks", "84%", "Current average", BookOpen],
            ["Assignments", "8 / 10", "Completed", CalendarDays],
            ["Notices", "4", "New updates", Bell],
          ].map(([label, value, note, Icon]) => (
            <div key={label as string} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="text-blue-700" size={22} />
              <p className="mt-4 text-sm font-semibold text-slate-500">{label as string}</p>
              <p className="mt-1 text-2xl font-black text-[#102a43]">{value as string}</p>
              <p className="mt-1 text-xs text-slate-400">{note as string}</p>
            </div>
          ))}
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-black text-[#102a43]">Quick Access</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {["Attendance", "Marks", "Timetable", "Assignments", "Study Materials", "Fee Status"].map((item) => (
                <button key={item} className="rounded-xl bg-slate-50 px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700">{item}</button>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-black text-[#102a43]">Latest Notice</h2>
            <div className="mt-4 rounded-xl bg-blue-50 p-4">
              <p className="font-bold text-blue-900">Unit Test Schedule Released</p>
              <p className="mt-1 text-sm text-blue-700">Check your timetable for the upcoming internal assessment.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
