"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Notice = { id: string; title: string; body: string; published_at: string; expires_at: string | null; audience: string };

export default function StudentNoticesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.replace("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (!profile || profile.role !== "student") { await supabase.auth.signOut(); router.replace("/login"); return; }

      const { data } = await supabase.from("notices")
        .select("id,title,body,published_at,expires_at,audience")
        .or("audience.eq.all,audience.eq.students")
        .order("published_at", { ascending: false });
      setRows(data ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  const activeRows = useMemo(() => {
    const now = Date.now();
    return rows.filter(r => !r.expires_at || new Date(r.expires_at).getTime() >= now);
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? activeRows.filter(r => (r.title + " " + r.body).toLowerCase().includes(q)) : activeRows;
  }, [activeRows, search]);

  return <main className="min-h-screen bg-slate-50">
    <header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4"><Link href="/student" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18}/></Link><Bell className="text-blue-700"/><h1 className="font-black text-[#102a43]">Notices</h1></div></header>
    <div className="mx-auto max-w-6xl px-5 py-8">
      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-700"/></div> : <>
        <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notices..." className="w-full rounded-xl border bg-white py-3 pl-11 pr-4 outline-none focus:border-blue-500"/></div>
        <div className="mt-6 space-y-4">
          {filtered.length ? filtered.map(row => <article key={row.id} className="rounded-2xl border bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{row.audience === "students" ? "Students" : "All Students"}</span><h2 className="mt-3 text-xl font-black text-[#102a43]">{row.title}</h2></div><p className="text-xs font-semibold text-slate-500">{new Date(row.published_at).toLocaleString("en-IN")}</p></div>
            <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-600">{row.body}</p>
            {row.expires_at && <p className="mt-4 border-t pt-3 text-xs font-semibold text-slate-400">Published until {new Date(row.expires_at).toLocaleString("en-IN")}</p>}
          </article>) : <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">{search ? "No notices match your search." : "No active notices have been published yet."}</div>}
        </div>
      </>}
    </div>
  </main>;
}