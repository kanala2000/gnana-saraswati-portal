"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Bell, BookOpen, CalendarDays, GraduationCap, IndianRupee, Loader2, LogOut, Users, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Profile = { full_name: string; role: string; college_id: string | null };

type Counts = {
  students: number;
  faculty: number;
  courses: number;
  sections: number;
  pendingFees: number;
  notices: number;
};

export default function PrincipalDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [counts, setCounts] = useState<Counts>({ students: 0, faculty: 0, courses: 0, sections: 0, pendingFees: 0, notices: 0 });
  const [collegeName, setCollegeName] = useState("Gnana Saraswati Jr. College");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.replace("/login"); return; }

      const { data: p } = await supabase.from("profiles").select("full_name,role,college_id").eq("id", session.user.id).single();
      if (!p || p.role !== "principal") {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      setProfile(p);

      const collegeId = p.college_id;
      if (collegeId) {
        const { data: college } = await supabase.from("colleges").select("name").eq("id", collegeId).single();
        if (college?.name) setCollegeName(college.name);
      }

      const [students, faculty, courses, sections, fees, notices] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("faculty").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("sections").select("id", { count: "exact", head: true }),
        supabase.from("fees").select("id", { count: "exact", head: true }).in("status", ["pending", "partial"]),
        supabase.from("notices").select("id", { count: "exact", head: true }),
      ]);

      setCounts({
        students: students.count ?? 0,
        faculty: faculty.count ?? 0,
        courses: courses.count ?? 0,
        sections: sections.count ?? 0,
        pendingFees: fees.count ?? 0,
        notices: notices.count ?? 0,
      });
      setLoading(false);
    }
    load();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const cards = [
    ["Students", counts.students, Users, "/admin/students"],
    ["Faculty", counts.faculty, UserRound, "/admin/faculty"],
    ["Courses", counts.courses, BookOpen, "/admin/courses"],
    ["Sections", counts.sections, GraduationCap, "/admin/sections"],
    ["Pending Fee Items", counts.pendingFees, IndianRupee, "/admin/fees"],
    ["Notices", counts.notices, Bell, "/admin/notices"],
  ] as const;

  const operations = [
    ["Attendance", "Review attendance records", "/admin/attendance", CalendarDays],
    ["Marks & Exams", "Review examination records", "/admin/marks", BarChart3],
    ["Timetable", "Review academic schedule", "/admin/timetable", CalendarDays],
    ["Academic Years", "Manage academic years", "/admin/academic-years", CalendarDays],
    ["Subjects", "Manage subjects", "/admin/subjects", BookOpen],
  ] as const;

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-700" size={28}/></main>;
  if (!profile) return null;

  return <main className="min-h-screen bg-slate-50">
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#102a43] text-white"><GraduationCap size={22}/></div><div><p className="text-sm font-extrabold text-blue-700">{collegeName.toUpperCase()}</p><p className="text-xs text-slate-500">Principal Portal</p></div></div>
        <button onClick={logout} className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"><LogOut size={16}/> Logout</button>
      </div>
    </header>

    <div className="mx-auto max-w-7xl px-5 py-8">
      <section className="rounded-3xl bg-[#102a43] p-7 text-white"><p className="text-sm font-semibold text-blue-200">Institution Overview</p><h1 className="mt-1 text-3xl font-black">Welcome, {profile.full_name}</h1><p className="mt-2 text-sm text-slate-300">Monitor academic and administrative operations from one place.</p></section>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([title,value,Icon,href]) => <Link key={title} href={href} className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md"><Icon className="text-blue-700" size={23}/><p className="mt-4 text-sm text-slate-500">{title}</p><p className="mt-1 text-3xl font-black text-[#102a43]">{value}</p></Link>)}
      </div>

      <section className="mt-7 rounded-2xl border bg-white p-6"><h2 className="font-black text-[#102a43]">Academic Operations</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{operations.map(([title,description,href,Icon]) => <Link key={title} href={href} className="rounded-xl border p-4 hover:bg-slate-50"><Icon className="text-blue-700" size={20}/><p className="mt-3 font-bold text-[#102a43]">{title}</p><p className="mt-1 text-xs text-slate-500">{description}</p></Link>)}</div></section>
    </div>
  </main>;
}