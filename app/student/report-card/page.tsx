"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Mark={exam_id:string;subject_id:string;marks:number;max_marks:number};
type Exam={id:string;name:string;exam_date:string|null};
type Subject={id:string;name:string;code:string};

export default function StudentReportCard(){
 const router=useRouter();const[loading,setLoading]=useState(true);const[name,setName]=useState("");const[admission,setAdmission]=useState("");const[rows,setRows]=useState<{exam:string;date:string;subject:string;code:string;marks:number;max:number;pct:number}[]>([]);
 useEffect(()=>{(async()=>{
  const {data:{session}}=await supabase.auth.getSession();if(!session){router.replace("/login");return}
  const {data:p}=await supabase.from("profiles").select("full_name,role,is_active").eq("id",session.user.id).single();
  if(!p||p.role!=="student"||p.is_active===false){await supabase.auth.signOut();router.replace("/login");return}
  setName(p.full_name);
  const {data:s}=await supabase.from("students").select("id,admission_number").eq("profile_id",session.user.id).single();
  if(!s){setLoading(false);return} setAdmission(s.admission_number);
  const [m,e,sub]=await Promise.all([
   supabase.from("marks").select("exam_id,subject_id,marks,max_marks").eq("student_id",s.id),
   supabase.from("exams").select("id,name,exam_date").order("exam_date",{ascending:true}),
   supabase.from("subjects").select("id,name,code")
  ]);
  const exams=(e.data??[]) as Exam[], subs=(sub.data??[]) as Subject[];
  setRows(((m.data??[]) as Mark[]).map(x=>{const ex=exams.find(z=>z.id===x.exam_id),su=subs.find(z=>z.id===x.subject_id);return ex&&su?{exam:ex.name,date:ex.exam_date??"—",subject:su.name,code:su.code,marks:Number(x.marks),max:Number(x.max_marks),pct:Number(x.max_marks)?Number(x.marks)/Number(x.max_marks)*100:0}:null}).filter(Boolean) as {exam:string;date:string;subject:string;code:string;marks:number;max:number;pct:number}[]);
  setLoading(false);
 })()},[router]);
 if(loading)return <main className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-700"/></main>;
 const total=rows.reduce((n,x)=>n+x.marks,0),maxTotal=rows.reduce((n,x)=>n+x.max,0),overall=maxTotal?total/maxTotal*100:0;
 return <main className="min-h-screen bg-slate-50"><header className="border-b bg-white print:hidden"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4"><Link href="/student" className="flex items-center gap-2 text-sm font-bold text-slate-600"><ArrowLeft size={17}/> Student Portal</Link><button onClick={()=>window.print()} className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white"><Printer size={16}/> Print / Save PDF</button></div></header><div className="mx-auto max-w-5xl px-5 py-8 print:px-0 print:py-0"><section className="rounded-2xl border bg-white p-7 print:rounded-none print:border-0"><div className="border-b pb-5 text-center"><p className="text-sm font-black uppercase tracking-[.18em] text-blue-700">Gnana Saraswati Jr. College</p><h1 className="mt-2 text-2xl font-black text-[#102a43]">Student Report Card</h1><div className="mt-4 flex flex-wrap justify-center gap-x-8 gap-y-1 text-sm text-slate-600"><span><b>Student:</b> {name}</span><span><b>Admission No:</b> {admission}</span></div></div><div className="mt-6 grid gap-4 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">Entries</p><p className="mt-1 text-2xl font-black">{rows.length}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">Marks</p><p className="mt-1 text-2xl font-black">{total.toFixed(1)} / {maxTotal.toFixed(1)}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">Overall</p><p className="mt-1 text-2xl font-black">{overall.toFixed(1)}%</p></div></div><div className="mt-7 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Exam</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Marks</th><th className="px-4 py-3">%</th></tr></thead><tbody className="divide-y">{rows.map((x,i)=><tr key={i}><td className="px-4 py-3 font-semibold">{x.exam}</td><td className="px-4 py-3">{x.date}</td><td className="px-4 py-3">{x.code} — {x.subject}</td><td className="px-4 py-3 font-bold">{x.marks} / {x.max}</td><td className="px-4 py-3">{x.pct.toFixed(1)}%</td></tr>)}</tbody></table>{!rows.length&&<p className="p-10 text-center text-sm text-slate-500">No examination marks have been entered yet.</p>}</div><p className="mt-8 text-xs text-slate-400">This report reflects examination marks currently recorded in the college portal.</p></section></div></main>
}