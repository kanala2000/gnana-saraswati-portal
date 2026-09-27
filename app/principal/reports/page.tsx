"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, IndianRupee, Loader2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Stat={label:string;value:string;note:string};
export default function PrincipalReports(){
 const router=useRouter(); const[loading,setLoading]=useState(true); const[stats,setStats]=useState<Stat[]>([]);
 useEffect(()=>{(async()=>{const{data:{session}}=await supabase.auth.getSession();if(!session){router.replace("/login");return}const{data:p}=await supabase.from("profiles").select("role").eq("id",session.user.id).single();if(!p||p.role!=="principal"){await supabase.auth.signOut();router.replace("/login");return}
 const [st,att,fees,marks,fa]=await Promise.all([
  supabase.from("students").select("id",{count:"exact",head:true}).eq("status","active"),
  supabase.from("attendance").select("status"),
  supabase.from("fees").select("amount,paid_amount,status"),
  supabase.from("marks").select("marks,max_marks"),
  supabase.from("faculty_assignments").select("id",{count:"exact",head:true})
 ]);
 const ar=att.data??[];const present=ar.filter(x=>x.status==="present"||x.status==="late").length;const attendance=ar.length?((present/ar.length)*100).toFixed(1)+"%":"—";
 const fr=fees.data??[];const billed=fr.reduce((n,x)=>n+Number(x.amount||0),0);const paid=fr.reduce((n,x)=>n+Number(x.paid_amount||0),0);const balance=Math.max(billed-paid,0);
 const mr=marks.data??[];const markPct=mr.length?(mr.reduce((n,x)=>n+(Number(x.marks||0)/Number(x.max_marks||1))*100,0)/mr.length).toFixed(1)+"%":"—";
 setStats([
  {label:"Active Students",value:String(st.count??0),note:"Currently active student records"},
  {label:"Overall Attendance",value:attendance,note:ar.length?String(ar.length)+" attendance entries":"No attendance entries yet"},
  {label:"Marks Average",value:markPct,note:mr.length?String(mr.length)+" marks entries":"No marks entries yet"},
  {label:"Fees Collected",value:"₹"+paid.toLocaleString("en-IN"),note:"Recorded paid amount"},
  {label:"Fee Balance",value:"₹"+balance.toLocaleString("en-IN"),note:"Billed minus paid"},
  {label:"Faculty Assignments",value:String(fa.count??0),note:"Section + subject teaching assignments"}
 ]);setLoading(false)})()},[router]);
 if(loading)return <main className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-700"/></main>;
 return <main className="min-h-screen bg-slate-50"><header className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-4"><Link href="/principal" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18}/></Link><BarChart3 className="text-blue-700"/><div><h1 className="font-black text-[#102a43]">Institution Reports</h1><p className="text-xs text-slate-500">Live figures from the college database</p></div></div></header><div className="mx-auto max-w-7xl px-5 py-8"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{stats.map(s=><section key={s.label} className="rounded-2xl border bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-500">{s.label}</p><Users size={19} className="text-blue-700"/></div><p className="mt-3 text-3xl font-black text-[#102a43]">{s.value}</p><p className="mt-2 text-xs text-slate-500">{s.note}</p></section>)}</div><div className="mt-6 rounded-2xl border bg-white p-6"><h2 className="font-black text-[#102a43]">Operational Views</h2><div className="mt-4 flex flex-wrap gap-3"><Link href="/admin/attendance" className="rounded-xl border px-4 py-3 text-sm font-bold hover:bg-slate-50">Attendance Records</Link><Link href="/admin/marks" className="rounded-xl border px-4 py-3 text-sm font-bold hover:bg-slate-50">Marks & Exams</Link><Link href="/admin/fees" className="rounded-xl border px-4 py-3 text-sm font-bold hover:bg-slate-50">Fee Records</Link><Link href="/admin/facultyassignments" className="rounded-xl border px-4 py-3 text-sm font-bold hover:bg-slate-50">Faculty Assignments</Link></div></div></div></main>
}