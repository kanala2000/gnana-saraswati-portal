"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Notice = { id: string; title: string; body: string; published_at: string; expires_at: string | null };

export default function StudentNoticesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.replace("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (!profile || profile.role !== "student") { await supabase.auth.signOut(); router.replace("/login"); return; }
      const { data } = await supabase.from("notices").select("id, title, body, published_at, expires_at").order("published_at", { ascending: false });
      setRows(data ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white"><div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-4"><Link href="/student" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18} /></Link><Bell className="text-blue-700" /><h1 className="font-black text-[#102a43]">Notices</h1></div></header>
      <div className="mx-auto max-w-5xl px-5 py-8">
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-700" /></div> : rows.length ? <div className="space-y-4">{rows.map((row) => <article key={row.id} className="rounded-2xl border bg-white p-6"><p className="text-xs font-bold text-slate-500">{new Date(row.published_at).toLocaleString()}</p><h2 className="mt-2 text-xl font-black text-[#102a43]">{row.title}</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">{row.body}</p></article>)}</div> : <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">No notices have been published yet.</div>}
      </div>
    </main>
  );
}
