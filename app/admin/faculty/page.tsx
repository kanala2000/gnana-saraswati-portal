"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, UserRoundCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Faculty = { id: string; employee_number: string; designation: string | null; department: string | null; status: string; profile_id: string };

export default function AdminFacultyPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Faculty[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.replace("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (!profile || !["admin", "principal"].includes(profile.role)) { await supabase.auth.signOut(); router.replace("/login"); return; }

      const { data } = await supabase.from("faculty").select("id, employee_number, designation, department, status, profile_id").order("employee_number");
      const faculty = data ?? [];
      setRows(faculty);
      const ids = faculty.map((x) => x.profile_id);
      if (ids.length) {
        const { data: people } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        const map: Record<string, string> = {};
        people?.forEach((x) => { map[x.id] = x.full_name; });
        setProfiles(map);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-4"><Link href="/admin" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18} /></Link><UserRoundCog className="text-blue-700" /><h1 className="font-black text-[#102a43]">Faculty</h1></div></header>
      <div className="mx-auto max-w-7xl px-5 py-8">
        <div className="overflow-hidden rounded-2xl border bg-white">{loading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-700" /></div> : rows.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Faculty</th><th className="px-5 py-3">Employee No.</th><th className="px-5 py-3">Designation</th><th className="px-5 py-3">Department</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y">{rows.map((row) => <tr key={row.id}><td className="px-5 py-4 font-bold">{profiles[row.profile_id] ?? "Profile"}</td><td className="px-5 py-4">{row.employee_number}</td><td className="px-5 py-4">{row.designation ?? "—"}</td><td className="px-5 py-4">{row.department ?? "—"}</td><td className="px-5 py-4 capitalize">{row.status}</td></tr>)}</tbody></table></div> : <p className="p-10 text-center text-sm text-slate-500">No faculty records found.</p>}</div>
      </div>
    </main>
  );
}
