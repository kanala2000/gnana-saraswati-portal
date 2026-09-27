"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Exam={id:string;name:string;exam_date:string|null;academic_year_id:string};
type Year={id:string;name:string};

export default function AdminExamsPage(){
 const router=useRouter();const[rows,setRows]=useState<Exam[]>([]);const[years,setYears]=useState<Year[]>([]);const[yearId,setYearId]=useState("");const[name,setName]=useState("");const[date,setDate]=useState("");const[loading,setLoading]=useState(true);const[saving,setSaving]=useState(false);const[error,setError]=useState("");
 async function load(){
  const{data:{session}}=await supabase.auth.getSession();if(!session?.user){router.replace("/login");return;}
  const{data:p}=await supabase.from("profiles").select("role").eq("id",session.user.id).single();
  if(!p||!["admin","principal"].includes(p.role)){await supabase.auth.signOut();router.replace("/login");return;}
  const[a,b]=await Promise.all([supabase.from("academic_years").select("id,name").order("name",{ascending:false}),supabase.from("exams").select("id,name,exam_date,academic_year_id").order("exam_date",{ascending:false})]);
  setYears(a.data??[]);setRows(b.data??[]);setLoading(false);
 }
 useEffect(()=>{load()},[router]);
 async function add(e:React.FormEvent){
  e.preventDefault();setError("");setSaving(true);
  const{data:{user}}=await supabase.auth.getUser();
  const{data:p}=await supabase.from("profiles").select("college_id").eq("id",user?.id??"").single();
  if(!p?.college_id){setError("Your admin account is not linked to a college yet.");setSaving(false);return;}
  const{error}=await supabase.from("exams").insert({college_id:p.college_id,academic_year_id:yearId,name,exam_date:date||null});
  if(error)setError(error.message);else{setName("");setDate("");await load()}setSaving(false);
 }
 async function remove(id:string){if(!confirm("Delete this exam?"))return;const{error}=await supabase.from("exams").delete().eq("id",id);if(error)setError(error.message);else load();}
 return <main className="min-h-screen bg-slate-50"><header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4"><Link href="/admin" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18}/></Link><ClipboardList className="text-blue-700"/><h1 className="font-black text-[#102a43]">Exams</h1></div></header><div className="mx-auto max-w-6xl px-5 py-8">
 <form onSubmit={add} className="rounded-2xl border bg-white p-6"><h2 className="font-black">Create examination</h2><div className="mt-4 grid gap-3 md:grid-cols-3"><select required value={yearId} onChange={e=>setYearId(e.target.value)} className="rounded-xl border px-4 py-3"><option value="">Academic year</option>{years.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Unit Test 1" className="rounded-xl border px-4 py-3 outline-none"/><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="rounded-xl border px-4 py-3"/></div>{error&&<p className="mt-3 text-sm text-red-600">{error}</p>}<button disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Plus size={16}/>{saving?"Saving...":"Create Exam"}</button></form>
 <div className="mt-6 overflow-hidden rounded-2xl border bg-white">{loading?<div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-700"/></div>:rows.length?<table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Exam</th><th className="px-5 py-3">Academic Year</th><th className="px-5 py-3">Date</th><th></th></tr></thead><tbody className="divide-y">{rows.map(r=><tr key={r.id}><td className="px-5 py-4 font-bold">{r.name}</td><td className="px-5 py-4">{years.find(x=>x.id===r.academic_year_id)?.name??"—"}</td><td className="px-5 py-4">{r.exam_date??"—"}</td><td className="px-5 py-4 text-right"><button onClick={()=>remove(r.id)} className="text-red-600"><Trash2 size={17}/></button></td></tr>)}</tbody></table>:<p className="p-10 text-center text-sm text-slate-500">No examinations configured.</p>}</div></div></main>
}
