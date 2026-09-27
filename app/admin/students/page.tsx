"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Student = {
  id: string;
  admission_number: string;
  roll_number: string | null;
  status: string;
  profile_id: string;
};

export default function AdminStudentsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Student[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [academicYears, setAcademicYears] = useState<{id:string;name:string}[]>([]);
  const [sections, setSections] = useState<{id:string;name:string;year_level:number;academic_year_id:string}[]>([]);
  const [form, setForm] = useState({email:"",password:"",full_name:"",admission_number:"",roll_number:"",academic_year_id:"",section_id:"",phone:"",date_of_birth:"",gender:"",guardian_name:"",guardian_phone:"",address:"",admission_date:""});

  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { router.replace("/login"); return; }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
    if (!profile || !["admin", "principal"].includes(profile.role)) {
      await supabase.auth.signOut();
      router.replace("/login");
      return;
    }

    const { data } = await supabase
      .from("students")
      .select("id, admission_number, roll_number, status, profile_id")
      .order("admission_number");

    const students = data ?? [];
    setRows(students);

    const ids = students.map((x) => x.profile_id);
    if (ids.length) {
      const { data: people } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      const map: Record<string, string> = {};
      people?.forEach((x) => { map[x.id] = x.full_name; });
      setProfiles(map);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    async function loadOptions() {
      const [years, sectionRows] = await Promise.all([
        supabase.from("academic_years").select("id,name").order("name", { ascending: false }),
        supabase.from("sections").select("id,name,year_level,academic_year_id").order("name")
      ]);
      setAcademicYears(years.data ?? []);
      setSections(sectionRows.data ?? []);
    }
    loadOptions();
  }, [router]);

  const filtered = rows.filter((row) => {
    const q = search.toLowerCase();
    return row.admission_number.toLowerCase().includes(q) ||
      (row.roll_number ?? "").toLowerCase().includes(q) ||
      (profiles[row.profile_id] ?? "").toLowerCase().includes(q);
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3"><Link href="/admin" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18} /></Link><Users className="text-blue-700" /><h1 className="font-black text-[#102a43]">Students</h1></div>
          <button onClick={() => { setShowForm(true); setError(""); }} className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"><Plus size={16} /> Add Student</button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 py-8">
        {showForm && <section className="mb-6 rounded-2xl border bg-white p-6">
          <div className="flex items-center justify-between"><h2 className="text-xl font-black text-[#102a43]">Create Student Account</h2><button onClick={() => setShowForm(false)} className="text-sm font-bold text-slate-500">Cancel</button></div>
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["full_name","Full name"],["email","Login email"],["password","Temporary password"],["admission_number","Admission number"],["roll_number","Roll number"],["phone","Phone"],["guardian_name","Guardian name"],["guardian_phone","Guardian phone"],["address","Address"]
            ].map(([key,label]) => <input key={key} type={key==="password" ? "password" : "text"} placeholder={label} value={form[key as keyof typeof form]} onChange={e => setForm({...form,[key]:e.target.value})} className="rounded-xl border px-4 py-3 outline-none focus:border-blue-500" />)}
            <input type="date" value={form.date_of_birth} onChange={e => setForm({...form,date_of_birth:e.target.value})} className="rounded-xl border px-4 py-3"/>
            <input type="date" value={form.admission_date} onChange={e => setForm({...form,admission_date:e.target.value})} className="rounded-xl border px-4 py-3"/>
            <select value={form.gender} onChange={e => setForm({...form,gender:e.target.value})} className="rounded-xl border px-4 py-3"><option value="">Gender</option><option>Male</option><option>Female</option><option>Other</option></select>
            <select value={form.academic_year_id} onChange={e => setForm({...form,academic_year_id:e.target.value,section_id:""})} className="rounded-xl border px-4 py-3"><option value="">Academic year</option>{academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}</select>
            <select value={form.section_id} onChange={e => setForm({...form,section_id:e.target.value})} className="rounded-xl border px-4 py-3"><option value="">Section</option>{sections.filter(s => !form.academic_year_id || s.academic_year_id === form.academic_year_id).map(s => <option key={s.id} value={s.id}>{s.name} — Year {s.year_level}</option>)}</select>
          </div>
          <button disabled={saving} onClick={async () => {
            setSaving(true); setError("");
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { setError("Session expired. Please login again."); setSaving(false); return; }
            const res = await fetch("/api/admin/students", { method:"POST", headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`}, body:JSON.stringify(form) });
            const result = await res.json();
            if (!res.ok) { setError(result.error || "Could not create student."); setSaving(false); return; }
            setShowForm(false); setForm({email:"",password:"",full_name:"",admission_number:"",roll_number:"",academic_year_id:"",section_id:"",phone:"",date_of_birth:"",gender:"",guardian_name:"",guardian_phone:"",address:"",admission_date:""}); await load(); setSaving(false);
          }} className="mt-5 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? "Creating..." : "Create Student Account"}</button>
        </section>
        <div className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3"><Search size={18} className="text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, admission number or roll number" className="w-full outline-none" /></div>
        <div className="mt-5 overflow-hidden rounded-2xl border bg-white">
          {loading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-700" /></div> : filtered.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">Admission No.</th><th className="px-5 py-3">Roll No.</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y">{filtered.map((row) => <tr key={row.id}><td className="px-5 py-4 font-bold">{profiles[row.profile_id] ?? "Profile"}</td><td className="px-5 py-4">{row.admission_number}</td><td className="px-5 py-4">{row.roll_number ?? "—"}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize">{row.status}</span></td></tr>)}</tbody></table></div> : <p className="p-10 text-center text-sm text-slate-500">No student records found.</p>}
        </div>
      </div>
    </main>
  );
}
