"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, IndianRupee, Loader2, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Fee = { id: string; fee_type: string; amount: number; paid_amount: number; status: string; due_date: string | null; paid_at: string | null };

export default function StudentFeesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.replace("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (!profile || profile.role !== "student") { await supabase.auth.signOut(); router.replace("/login"); return; }
      const { data: student } = await supabase.from("students").select("id").eq("profile_id", session.user.id).single();
      if (!student) { setLoading(false); return; }
      const { data } = await supabase.from("fees").select("id,fee_type,amount,paid_amount,status,due_date,paid_at").eq("student_id", student.id).order("due_date", { ascending: true, nullsFirst: false });
      setRows(data ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  const filtered = useMemo(() => statusFilter === "all" ? rows : rows.filter(r => r.status === statusFilter), [rows, statusFilter]);
  const total = rows.reduce((sum,x) => sum + Number(x.amount),0);
  const paid = rows.reduce((sum,x) => sum + Number(x.paid_amount),0);
  const balance = Math.max(total-paid,0);
  const pending = rows.filter(x => x.status === "pending" || x.status === "partial").length;
  const overdue = rows.filter(x => x.due_date && new Date(x.due_date + "T23:59:59").getTime() < Date.now() && x.status !== "paid" && x.status !== "waived").length;

  return <main className="min-h-screen bg-slate-50">
    <header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4"><div className="flex items-center gap-3"><Link href="/student" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18}/></Link><IndianRupee className="text-blue-700"/><h1 className="font-black text-[#102a43]">Fees</h1></div><button onClick={()=>window.print()} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white print:hidden"><Printer size={16}/> Print Statement</button></div></header>
    <div className="mx-auto max-w-6xl px-5 py-8 print:px-0 print:py-0">
      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-700"/></div> : <>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Total Fees</p><p className="mt-1 text-2xl font-black text-[#102a43]">₹{total.toLocaleString("en-IN")}</p></div>
          <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Paid</p><p className="mt-1 text-2xl font-black text-green-700">₹{paid.toLocaleString("en-IN")}</p></div>
          <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Balance</p><p className="mt-1 text-2xl font-black text-red-600">₹{balance.toLocaleString("en-IN")}</p></div>
          <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Pending Items</p><p className="mt-1 text-2xl font-black text-amber-600">{pending}</p></div>
        </div>
        {overdue > 0 && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{overdue} fee item{overdue > 1 ? "s are" : " is"} past the due date.</div>}
        <div className="mt-6"><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full rounded-xl border bg-white px-4 py-3 sm:w-72"><option value="all">All fee records</option><option value="pending">Pending</option><option value="partial">Partial</option><option value="paid">Paid</option><option value="waived">Waived</option></select></div>
        <div className="mt-6 overflow-hidden rounded-2xl border bg-white print:rounded-none print:border-0">
          {filtered.length ? <div className="border-b bg-slate-50 px-5 py-4 print:block"><p className="text-lg font-black text-[#102a43]">Gnana Saraswati Jr. College</p><p className="text-xs text-slate-500">Student Fee Statement</p><p className="mt-2 text-sm">Generated on {new Date().toLocaleDateString("en-IN")}</p></div><div className="divide-y">{filtered.map(row => {
            const balanceForRow = Math.max(Number(row.amount)-Number(row.paid_amount),0);
            return <div key={row.id} className="grid gap-4 px-5 py-5 sm:grid-cols-[1fr_auto_auto] sm:items-center">
              <div><p className="font-bold text-[#102a43]">{row.fee_type}</p><p className="text-xs text-slate-500">{row.due_date ? "Due " + row.due_date : "No due date"}{row.paid_at ? " • Paid " + new Date(row.paid_at).toLocaleDateString("en-IN") : ""}</p></div>
              <div className="text-sm"><p>Paid ₹{Number(row.paid_amount).toLocaleString("en-IN")} / ₹{Number(row.amount).toLocaleString("en-IN")}</p><p className="text-xs text-slate-500">Balance ₹{balanceForRow.toLocaleString("en-IN")}</p></div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize">{row.status}</span>
            </div>;
          })}</div> : <p className="p-8 text-center text-sm text-slate-500">No fee records found.</p>}
        </div>
      </>}
    </div>
  </main>;
}