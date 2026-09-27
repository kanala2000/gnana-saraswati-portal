"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, CheckCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Notification = {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role,is_active")
      .eq("id", user.id)
      .single();

    if (!profile || profile.is_active === false) {
      await supabase.auth.signOut();
      router.replace("/login");
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("notifications")
      .select("id,title,message,notification_type,is_read,created_at,read_at")
      .eq("recipient_profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (fetchError) setError(fetchError.message);
    setRows(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [router]);

  async function markRead(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("recipient_profile_id", (await supabase.auth.getUser()).data.user?.id ?? "");
    if (error) setError(error.message);
    else setRows(current => current.map(row => row.id === id ? { ...row, is_read: true, read_at: new Date().toISOString() } : row));
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const unreadIds = rows.filter(r => !r.is_read).map(r => r.id);
    if (!unreadIds.length) return;
    const { error } = await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).in("id", unreadIds).eq("recipient_profile_id", user.id);
    if (error) setError(error.message);
    else setRows(current => current.map(row => ({ ...row, is_read: true, read_at: row.read_at ?? new Date().toISOString() })));
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18}/></Link>
            <Bell className="text-blue-700" />
            <div><h1 className="font-black text-[#102a43]">Notifications</h1><p className="text-xs text-slate-500">Official portal notifications</p></div>
          </div>
          <button onClick={markAllRead} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><CheckCheck size={15}/> Mark all read</button>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-5 py-8">
        {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {loading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-700"/></div> :
          rows.length ? <div className="space-y-3">{rows.map(row => (
            <article key={row.id} className={`rounded-2xl border bg-white p-5 ${row.is_read ? "border-slate-200" : "border-blue-200 bg-blue-50/40"}`}>
              <div className="flex items-start justify-between gap-4">
                <div><span className="text-[11px] font-black uppercase tracking-wide text-blue-700">{row.notification_type}</span><h2 className="mt-1 font-black text-[#102a43]">{row.title}</h2></div>
                {!row.is_read && <button onClick={() => markRead(row.id)} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700">Mark read</button>}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{row.message}</p>
              <p className="mt-3 text-xs text-slate-400">{new Date(row.created_at).toLocaleString("en-IN")}</p>
            </article>
          ))}</div> :
          <div className="rounded-2xl border bg-white p-12 text-center"><Bell className="mx-auto text-slate-300" size={38}/><p className="mt-4 font-bold text-slate-600">No notifications yet.</p><p className="mt-1 text-sm text-slate-400">New official updates will appear here.</p></div>}
      </div>
    </main>
  );
}
