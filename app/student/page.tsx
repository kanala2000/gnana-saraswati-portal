"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, LogOut, ClipboardCheck, BookOpen, CalendarDays, Bell, Loader2, IndianRupee } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type StudentProfile = {
  full_name: string;
  student_id: string | null;
  role: string;
};

export default function StudentDashboard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  useEffect(() => {
    async function loadStudent() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.replace("/login"); return; }

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", session.user.id)
        .single();

      if (error || !data || data.role !== "student") {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      const { data: student } = await supabase
        .from("students")
        .select("admission_number")
        .eq("profile_id", session.user.id)
        .single();

      setProfile({ ...data, student_id: student?.admission_number ?? null });
      setChecking(false);
    }

    loadStudent();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (checking) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-700" size={28} /></main>;
  }

  if (!profile) return null;

  const modules = [
    ["Attendance", "View your subject-wise attendance", ClipboardCheck, "/student/attendance"],
    ["Marks & Exams", "View published examination results", BookOpen, "/student/marks"],
    ["Timetable", "View your current class schedule", CalendarDays, "/student/timetable"],
    ["Assignments", "View assignments and due dates", BookOpen, "/student/assignments"],
    ["Fees", "View fee records and payment status", IndianRupee, "/student/fees"],
    ["Notices", "Read official college announcements", Bell, "/student/notices"],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#102a43] text-white"><GraduationCap size={22} /></div>
            <div><p className="text-sm font-extrabold text-blue-700">GNANA SARASWATI JR. COLLEGE</p><p className="text-xs text-slate-500">Student Portal • Bethamcherla</p></div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"><LogOut size={16} /> Logout</button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8">
        <section className="rounded-3xl bg-[#102a43] p-7 text-white">
          <p className="text-sm font-semibold text-blue-200">Student Portal</p>
          <h1 className="mt-1 text-3xl font-black">{profile.full_name}</h1>
          <p className="mt-2 text-sm text-slate-300">Admission Number: {profile.student_id ?? "Not assigned"}</p>
        </section>

        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(([title, description, Icon, href]) => (
            <Link key={title} href={href} className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <Icon className="text-blue-700" size={24} />
              <h2 className="mt-4 font-black text-[#102a43]">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
            </Link>
          ))}
        </div>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3"><Bell className="text-blue-700" size={22} /><h2 className="font-black text-[#102a43]">Notices</h2></div>
            <Link href="/student/notices" className="text-sm font-bold text-blue-700">View all</Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">Open Notices to view official college announcements.</p>
        </section>
      </div>
    </main>
  );
}
