"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

type Faculty = {
  employee_number: string;
  designation: string | null;
  department: string | null;
};

export default function FacultyDashboard() {
  const [loading, setLoading] = useState(true);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [stats, setStats] = useState({ timetable: 0, assignments: 0 });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name, is_active")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "faculty" || profile.is_active === false) {
        await supabase.auth.signOut();
        window.location.href = "/login";
        return;
      }

      const { data: facultyRow } = await supabase
        .from("faculty")
        .select("employee_number, designation, department")
        .eq("profile_id", user.id)
        .single();

      setFaculty(facultyRow);

      const { data: facultyIdRow } = await supabase
        .from("faculty")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (facultyIdRow) {
        const [{ count: timetable }, { count: assignments }] = await Promise.all([
          supabase.from("timetables").select("*", { count: "exact", head: true }).eq("faculty_id", facultyIdRow.id),
          supabase.from("assignments").select("*", { count: "exact", head: true }).eq("faculty_id", facultyIdRow.id),
        ]);
        setStats({ timetable: timetable ?? 0, assignments: assignments ?? 0 });
      }

      setLoading(false);
    };

    load();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) return <main className="min-h-screen bg-slate-950 text-white p-8">Loading faculty portal...</main>;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm text-sky-400">Gnana Saraswati Jr. College</p>
            <h1 className="text-2xl font-bold">Faculty Portal</h1>
          </div>
          <button onClick={logout} className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/10">Logout</button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Welcome</p>
          <h2 className="mt-1 text-3xl font-bold">{faculty?.employee_number || "Faculty"}</h2>
          <p className="mt-2 text-slate-400">
            {faculty?.designation || "Faculty"}{faculty?.department ? " • " + faculty.department : ""}
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Link href="/faculty/timetable" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
            <p className="text-3xl font-bold">{stats.timetable}</p>
            <p className="mt-2 font-semibold">My Timetable</p>
            <p className="mt-1 text-sm text-slate-400">View assigned periods and rooms.</p>
          </Link>
          <Link href="/faculty/assignments" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
            <p className="text-3xl font-bold">{stats.assignments}</p>
            <p className="mt-2 font-semibold">Assignments</p>
            <p className="mt-1 text-sm text-slate-400">Create and manage class assignments.</p>
          </Link>
          <Link href="/faculty/students" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10"><p className="font-semibold">My Students</p><p className="mt-1 text-sm text-slate-400">View students in your assigned sections.</p></Link>
          <Link href="/faculty/attendance" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
            <p className="font-semibold">Attendance</p>
            <p className="mt-1 text-sm text-slate-400">Enter attendance for assigned classes.</p>
          </Link>
          <Link href="/faculty/marks" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
            <p className="font-semibold">Marks</p>
            <p className="mt-1 text-sm text-slate-400">Enter marks for assigned classes.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
