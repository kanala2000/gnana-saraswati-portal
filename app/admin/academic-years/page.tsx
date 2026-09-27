"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Year = { id:string; name:string; start_date:string|null; end_date:string|null; is_current:boolean };

export default function AcademicYearsPage(){
 const router=useRouter();
 const [rows,setRows]=useState<Year[]>([]);
 const [name,setName]=useState(""); const [start,setStart]=useState(""); const [end,setEnd]=useState(""); const [saving,setSaving]=useState(false); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
 async function load(){
  const {data:{session}}=await supabase.auth.getSession(); if(!session?.user){router.replace("/login");return;}
  const {data:p}=await supabase.from("profiles").select("role").eq("id",session.user.id).single();
  if(!p||!["admin","principal"].includes(p.role)){await supabase.auth.signOut();router.replace("/login");return;}
  const {data}=await supabase.from("academic_years").select("id,name,start_date,end_date,is_current").order("name",{ascending:false});
  setRows(data??[]);setLoading(false);
 }
 useEffect(()=>{load()},[router]);
 async function add(e:React.FormEvent){e.preventDefault();setError("");setSaving(true);
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("college_id").eq("id", user?.id ?? "").single();
  if (!profile?.college_id) { setError("Your admin account is not linked to a college yet."); setSaving(false); return; }
  const {error}=await supabase.from("academic_years").insert({college_id:profile.college_id,name,start_date:start||null,end_date:end||null});
  if(error)setError(error.message);else{setName("");setStart("");setEnd("");await load()}setSaving(false);
 }
 async function remove(id:string){if(!confirm("Delete this academic year?"))return;const {error}=await supabase.from("academic_years").delete().eq("id",id);if(error)setError(error.message);else load();}
 return <main className="min-h-screen bg-slate-50"><header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4"><Link href="/admin" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18}/></Link><CalendarDays className="text-blue-700"/><h1 className="font-black text-[#102a43]">Academic Years</h1></div></header><div className="mx-auto max-w-6xl px-5 py-8">
 <form onSubmit={add} className="rounded-2xl border bg-white p-6"><h2 className="font-black">Add academic year</h2><div className="mt-4 grid gap-3 md:grid-cols-3"><input required value={name} onChange={e=>setName(e.target.value)} placeholder="2026-27" className="rounded-xl border px-4 py-3 outline-none"/><input type="date" value={start} onChange={e=>setStart(e.target.value)} className="rounded-xl border px-4 py-3"/><input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="rounded-xl border px-4 py-3"/></div>{error&&<p className="mt-3 text-sm text-red-600">{error}</p>}<button disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Plus size={16}/>{saving?"Saving...":"Add Academic Year"}</button></form>
 <div className="mt-6 overflow-hidden rounded-2xl border bg-white">{loading?<div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-700"/></div>:rows.length?<table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Year</th><th className="px-5 py-3">Start</th><th className="px-5 py-3">End</th><th className="px-5 py-3">Current</th><th className="px-5 py-3"></th></tr></thead><tbody className="divide-y">{rows.map(r=><tr key={r.id}><td className="px-5 py-4 font-bold">{r.name}</td><td className="px-5 py-4">{r.start_date??"—"}</td><td className="px-5 py-4">{r.end_date??"—"}</td><td className="px-5 py-4">{r.is_current?"Yes":"No"}</td><td className="px-5 py-4 text-right"><button onClick={()=>remove(r.id)} className="text-red-600"><Trash2 size={17}/></button></td></tr>)}</tbody></table>:<p className="p-10 text-center text-sm text-slate-500">No academic years configured.</p>}</div>
 </div></main>
}
