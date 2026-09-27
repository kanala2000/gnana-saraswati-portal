"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Profile = { full_name: string; phone: string | null; role: string };
type Student = {
  admission_number: string; roll_number: string | null; date_of_birth: string | null; gender: string | null;
  guardian_name: string | null; guardian_phone: string | null; address: string | null; admission_date: string | null;
  status: string; section_id: string; academic_year_id: string;
};
type Section = { id: string; name: string; year_level: number; course_id: string };
type Course = { id: string; name: string; code: string };
type AcademicYear = { id: string; name: string };

export default function StudentProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.replace("/login"); return; }
      setEmail(session.user.email || "");

      const { data: p } = await supabase.from("profiles").select("full_name,phone,role").eq("id", session.user.id).single();
      if (!p || p.role !== "student") { await supabase.auth.signOut(); router.replace("/login"); return; }
      const { data: s } = await supabase.from("students").select("admission_number,roll_number,date_of_birth,gender,guardian_name,guardian_phone,address,admission_date,status,section_id,academic_year_id").eq("profile_id", session.user.id).single();
      setProfile(p);
      if (s) {
        setStudent(s);
        const [sectionResult, yearResult] = await Promise.all([
          supabase.from("sections").select("id,name,year_level,course_id").eq("id", s.section_id).single(),
          supabase.from("academic_years").select("id,name").eq("id", s.academic_year_id).single(),
        ]);
        setSection(sectionResult.data);
        setAcademicYear(yearResult.data);
        if (sectionResult.data?.course_id) {
          const { data: c } = await supabase.from("courses").select("id,name,code").eq("id", sectionResult.data.course_id).single();
          setCourse(c);
        }
      }
      setLoading(false);
    }
    load();
  }, [router]);

  return <main className="min-h-screen bg-slate-50">
    <header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4">
      <Link href="/student" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18}/></Link><UserCircle className="text-blue-700"/><h1 className="font-black text-[#102a43]">My Profile</h1>
    </div></header>
    <div className="mx-auto max-w-6xl px-5 py-8">
      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-700"/></div> : !profile || !student ? <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">Student profile is not fully linked yet. Please contact the college office.</div> : <>
        <section className="rounded-3xl bg-[#102a43] p-7 text-white"><p className="text-sm text-blue-200">Student Profile</p><h2 className="mt-1 text-3xl font-black">{profile.full_name}</h2><p className="mt-2 text-sm text-slate-300">Admission Number: {student.admission_number}</p></section>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border bg-white p-6"><h3 className="font-black text-[#102a43]">Academic Details</h3><div className="mt-4 space-y-3 text-sm"><p><span className="text-slate-500">Course:</span> {course ? course.code + " — " + course.name : "Not assigned"}</p><p><span className="text-slate-500">Year:</span> {section ? (section.year_level === 1 ? "First Year" : "Second Year") : "Not assigned"}</p><p><span className="text-slate-500">Section:</span> {section?.name || "Not assigned"}</p><p><span className="text-slate-500">Academic Year:</span> {academicYear?.name || "Not assigned"}</p><p><span className="text-slate-500">Roll Number:</span> {student.roll_number || "Not assigned"}</p><p><span className="text-slate-500">Admission Date:</span> {student.admission_date || "Not available"}</p><p><span className="text-slate-500">Status:</span> <span className="font-semibold capitalize">{student.status}</span></p></div></section>
          <section className="rounded-2xl border bg-white p-6"><h3 className="font-black text-[#102a43]">Personal & Contact</h3><div className="mt-4 space-y-3 text-sm"><p><span className="text-slate-500">Email:</span> {email || "Not available"}</p><p><span className="text-slate-500">Phone:</span> {profile.phone || "Not provided"}</p><p><span className="text-slate-500">Date of Birth:</span> {student.date_of_birth || "Not provided"}</p><p><span className="text-slate-500">Gender:</span> {student.gender || "Not provided"}</p><p><span className="text-slate-500">Guardian:</span> {student.guardian_name || "Not provided"}</p><p><span className="text-slate-500">Guardian Phone:</span> {student.guardian_phone || "Not provided"}</p><p><span className="text-slate-500">Address:</span> {student.address || "Not provided"}</p></div></section>
        </div>
      </>}
    </div>
  </main>;
}
