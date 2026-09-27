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

  useEffect(() => { load(); }, [router]);

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
          <button disabled className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white opacity-50"><Plus size={16} /> Add Student</button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 py-8">
        <div className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3"><Search size={18} className="text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, admission number or roll number" className="w-full outline-none" /></div>
        <div className="mt-5 overflow-hidden rounded-2xl border bg-white">
          {loading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-700" /></div> : filtered.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">Admission No.</th><th className="px-5 py-3">Roll No.</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y">{filtered.map((row) => <tr key={row.id}><td className="px-5 py-4 font-bold">{profiles[row.profile_id] ?? "Profile"}</td><td className="px-5 py-4">{row.admission_number}</td><td className="px-5 py-4">{row.roll_number ?? "—"}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize">{row.status}</span></td></tr>)}</tbody></table></div> : <p className="p-10 text-center text-sm text-slate-500">No student records found.</p>}
        </div>
      </div>
    </main>
  );
}
