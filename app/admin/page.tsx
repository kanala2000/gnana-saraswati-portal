"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  IndianRupee,
  LayoutDashboard,
  Loader2,
  LogOut,
  Users,
  UserRoundCog,
} from "lucide-react";
import { supabase } from "../lib/supabase";

type Stats = {
  students: number;
  faculty: number;
  courses: number;
  sections: number;
  notices: number;
  pendingFees: number;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState("");
  const [stats, setStats] = useState<Stats>({
    students: 0,
    faculty: 0,
    courses: 0,
    sections: 0,
    notices: 0,
    pendingFees: 0,
  });

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name, role, college_id")
        .eq("id", session.user.id)
        .single();

      if (
        error ||
        !profile ||
        !["admin", "principal"].includes(profile.role)
      ) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      setName(profile.full_name);

      const [
        students,
        faculty,
        courses,
        sections,
        notices,
        pendingFees,
      ] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("faculty").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("sections").select("id", { count: "exact", head: true }),
        supabase.from("notices").select("id", { count: "exact", head: true }),
        supabase
          .from("fees")
          .select("id", { count: "exact", head: true })
          .in("status", ["pending", "partial"]),
      ]);

      setStats({
        students: students.count ?? 0,
        faculty: faculty.count ?? 0,
        courses: courses.count ?? 0,
        sections: sections.count ?? 0,
        notices: notices.count ?? 0,
        pendingFees: pendingFees.count ?? 0,
      });

      setChecking(false);
    }

    load();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-700" size={28} />
      </main>
    );
  }

  const cards = [
    ["Students", stats.students, Users, "/admin/students"],
    ["Faculty", stats.faculty, UserRoundCog, "/admin/faculty"],
    ["Courses", stats.courses, GraduationCap, "/admin/courses"],
    ["Sections", stats.sections, LayoutDashboard, "/admin/sections"],
    ["Notices", stats.notices, Bell, "/admin/notices"],
    ["Pending Fees", stats.pendingFees, IndianRupee, "/admin/fees"],
    ["Attendance", 0, ClipboardCheck, "/admin/attendance"],
    ["Marks", 0, BookOpen, "/admin/marks"],
    ["Timetable", 0, CalendarDays, "/admin/timetable"],
    ["Faculty Assignments", 0, UserRoundCog, "/admin/faculty-assignments"],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#102a43] text-white">
              <GraduationCap size={22} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-blue-700">
                GNANA SARASWATI JR. COLLEGE
              </p>
              <p className="text-xs text-slate-500">Administration Portal</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8">
        <section className="rounded-3xl bg-[#102a43] p-7 text-white">
          <p className="text-sm text-blue-200">Administration Dashboard</p>
          <h1 className="mt-1 text-3xl font-black">Welcome, {name}</h1>
          <p className="mt-2 text-sm text-slate-300">
            Manage academic records, users, notices and student services from one place.
          </p>
        </section>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(([title, value, Icon, href]) => (
            <Link
              key={title}
              href={href}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <Icon className="text-blue-700" size={24} />
                <span className="text-3xl font-black text-[#102a43]">{value}</span>
              </div>
              <h2 className="mt-4 font-black text-[#102a43]">{title}</h2>
              <p className="mt-1 text-sm text-slate-500">Open management</p>
            </Link>
          ))}
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <Link href="/admin/academic-years" className="rounded-2xl border bg-white p-6 hover:shadow-md">
            <CalendarDays className="text-blue-700" />
            <h2 className="mt-4 font-black text-[#102a43]">Academic Years</h2>
            <p className="mt-1 text-sm text-slate-500">Configure the college academic calendar.</p>
          </Link>
          <Link href="/admin/subjects" className="rounded-2xl border bg-white p-6 hover:shadow-md">
            <BookOpen className="text-blue-700" />
            <h2 className="mt-4 font-black text-[#102a43]">Subjects</h2>
            <p className="mt-1 text-sm text-slate-500">Manage course-wise subjects and marks settings.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
