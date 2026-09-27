"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Loader2, Send, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Row = { id:string; title:string; message:string; notification_type:string; recipient_profile_id:string; created_at:string };
type Recipient = { id:string; full_name:string; role:string; email:string|null };

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [audience, setAudience] = useState("students");
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("general");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }
    const { data: actor } = await supabase.from("profiles").select("role,is_active,college_id").eq("id", user.id).single();
    if (!actor || !["admin","principal"].includes(actor.role) || actor.is_active === false) {
      await supabase.auth.signOut(); router.replace("/login"); return;
    }

    const [{ data: people, error: peopleError }, { data: sent, error: sentError }] = await Promise.all([
      supabase.from("profiles").select("id,full_name,role,email").eq("college_id", actor.college_id).eq("is_active", true).in("role", ["student","faculty"]).order("full_name"),
      supabase.from("notifications").select("id,title,message,notification_type,recipient_profile_id,created_at").eq("college_id", actor.college_id).not("recipient_profile_id","is",null).order("created_at",{ascending:false}).limit(100),
    ]);
    if (peopleError) setError(peopleError.message);
    if (sentError) setError(sentError.message);
    setRecipients(people ?? []);
    setRows(sent ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [router]);

  function selectAudience(value: string) {
    setAudience(value);
    setSelected([]);
  }

  async function sendNotification(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSuccess(""); setSending(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/login"); return; }

    const res = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ audience, recipient_profile_ids: selected, title, message, notification_type: type }),
    });
    const result = await res.json();
    if (!res.ok) setError(result.error ?? "Unable to send notification.");
    else {
      setSuccess(`Notification sent to ${result.sent} recipient${result.sent === 1 ? "" : "s"}.`);
      setTitle(""); setMessage(""); setSelected([]); await load();
    }
    setSending(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this notification?")) return;
    const { error: deleteError } = await supabase.from("notifications").delete().eq("id", id);
    if (deleteError) setError(deleteError.message); else load();
  }

  const filtered = audience === "students" ? recipients.filter(r => r.role === "student") : audience === "faculty" ? recipients.filter(r => r.role === "faculty") : recipients;
  const selectedSet = new Set(selected);
  const allVisibleSelected = filtered.length > 0 && filtered.every(r => selectedSet.has(r.id));

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4"><Link href="/admin" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18}/></Link><Bell className="text-blue-700"/><h1 className="font-black text-[#102a43]">Notifications</h1></div></header>
      <div className="mx-auto max-w-6xl px-5 py-8">
        <form onSubmit={sendNotification} className="rounded-2xl border bg-white p-6">
          <h2 className="font-black text-[#102a43]">Send notification</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <select value={audience} onChange={e => selectAudience(e.target.value)} className="rounded-xl border px-4 py-3"><option value="students">All students</option><option value="faculty">All faculty</option><option value="all">All students & faculty</option><option value="specific">Selected recipients</option></select>
            <select value={type} onChange={e => setType(e.target.value)} className="rounded-xl border px-4 py-3"><option value="general">General</option><option value="notice">Notice</option><option value="attendance">Attendance</option><option value="marks">Marks</option><option value="fees">Fees</option><option value="assignment">Assignment</option><option value="timetable">Timetable</option><option value="system">System</option></select>
            <input required value={title} onChange={e => setTitle(e.target.value)} maxLength={160} placeholder="Notification title" className="rounded-xl border px-4 py-3 outline-none"/>
          </div>
          <textarea required value={message} onChange={e => setMessage(e.target.value)} maxLength={4000} rows={4} placeholder="Notification message" className="mt-3 w-full rounded-xl border px-4 py-3 outline-none"/>
          {audience === "specific" && <div className="mt-4 rounded-xl border bg-slate-50 p-4"><div className="flex items-center justify-between"><p className="text-sm font-bold">Select recipients</p><button type="button" onClick={() => setSelected(allVisibleSelected ? [] : filtered.map(r=>r.id))} className="text-xs font-bold text-blue-700">{allVisibleSelected ? "Clear all" : "Select all"}</button></div><div className="mt-3 grid max-h-56 gap-2 overflow-auto sm:grid-cols-2">{filtered.map(r=><label key={r.id} className="flex items-center gap-3 rounded-lg bg-white p-3"><input type="checkbox" checked={selectedSet.has(r.id)} onChange={e=>setSelected(s=>e.target.checked?[...s,r.id]:s.filter(id=>id!==r.id))}/><span className="text-sm"><b>{r.full_name}</b><span className="ml-2 text-slate-400">{r.role}</span></span></label>)}</div></div>}
          {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {success && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}
          <button disabled={sending || (audience === "specific" && selected.length === 0)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Send size={16}/>{sending ? "Sending..." : "Send Notification"}</button>
        </form>

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-black text-[#102a43]">Recent sent notifications</h2><span className="text-xs text-slate-500">{rows.length} shown</span></div>
          {loading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-700"/></div> : rows.length ? <div className="space-y-3">{rows.map(r=><article key={r.id} className="rounded-2xl border bg-white p-5"><div className="flex items-start justify-between gap-4"><div><span className="text-[11px] font-black uppercase text-blue-700">{r.notification_type}</span><h3 className="mt-1 font-black text-[#102a43]">{r.title}</h3><p className="mt-1 text-sm text-slate-500">{new Date(r.created_at).toLocaleString("en-IN")}</p></div><button onClick={()=>remove(r.id)} className="text-red-600"><Trash2 size={17}/></button></div><p className="mt-3 text-sm text-slate-600">{r.message}</p></article>)}</div> : <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">No notifications sent yet.</div>}
        </section>
      </div>
    </main>
  );
}
