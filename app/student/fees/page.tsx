"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, IndianRupee, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Fee = { id: string; fee_type: string; amount: number; paid_amount: number; status: string; due_date: string | null };

export default function StudentFeesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.replace("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (!profile || profile.role !== "student") { await supabase.auth.signOut(); router.replace("/login"); return; }
      const { data: student } = await supabase.from("students").select("id").eq("profile_id", session.user.id).single();
      if (!student) { setLoading(false); return; }
      const { data } = await supabase.from("fees").select("id, fee_type, amount, paid_amount, status, due_date").eq("student_id", student.id).order("due_date", { ascending: true });
      setRows(data ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  const total = rows.reduce((sum, x) => sum + Number(x.amount), 0);
  const paid = rows.reduce((sum, x) => sum + Number(x.paid_amount), 0);
  const balance = Math.max(total - paid, 0);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white"><div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-4"><Link href="/student" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18} /></Link><IndianRupee className="text-blue-700" /><h1 className="font-black text-[#102a43]">Fees</h1></div></header>
      <div className="mx-auto max-w-5xl px-5 py-8">
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-700" /></div> : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              {[["Total", total], ["Paid", paid], ["Balance", balance]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border bg-white p-6"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-[#102a43]">₹{Number(value).toLocaleString("en-IN")}</p></div>)}
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border bg-white">
              {rows.length ? <div className="divide-y">{rows.map((row) => <div key={row.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="font-bold">{row.fee_type}</p><p className="text-xs text-slate-500">{row.due_date ? `Due ${row.due_date}` : "No due date"}</p></div><span className="text-sm">₹{Number(row.paid_amount).toLocaleString("en-IN")} / ₹{Number(row.amount).toLocaleString("en-IN")}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize">{row.status}</span></div>)}</div> : <p className="p-8 text-center text-sm text-slate-500">No fee records have been added yet.</p>}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
