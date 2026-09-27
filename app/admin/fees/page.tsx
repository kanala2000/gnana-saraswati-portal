"use client";

import { useEffect,useState } from "react";
import Link from "next/link";
import { ArrowLeft, IndianRupee, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Student={id:string;admission_number:string;profile_id:string};type Fee={id:string;student_id:string;fee_type:string;amount:number;paid_amount:number;status:string;due_date:string|null};

export default function AdminFeesPage(){
 const router=useRouter();const[students,setStudents]=useState<Student[]>([]);const[profiles,setProfiles]=useState<Record<string,string>>({});const[rows,setRows]=useState<Fee[]>([]);const[studentId,setStudentId]=useState("");const[feeType,setFeeType]=useState("");const[amount,setAmount]=useState("");const[due,setDue]=useState("");const[loading,setLoading]=useState(true);const[saving,setSaving]=useState(false);const[error,setError]=useState("");
 async function load(){
  const{data:{session}}=await supabase.auth.getSession();if(!session?.user){router.replace("/login");return;}
  const{data:p}=await supabase.from("profiles").select("role").eq("id",session.user.id).single();if(!p||!["admin","principal"].includes(p.role)){await supabase.auth.signOut();router.replace("/login");return;}
  const[a,b]=await Promise.all([supabase.from("students").select("id,admission_number,profile_id").order("admission_number"),supabase.from("fees").select("id,student_id,fee_type,amount,paid_amount,status,due_date").order("due_date")]);
  setStudents(a.data??[]);setRows(b.data??[]);
  const ids=(a.data??[]).map(x=>x.profile_id);if(ids.length){const{data:ps}=await supabase.from("profiles").select("id,full_name").in("id",ids);const m:Record<string,string>={};ps?.forEach(x=>m[x.id]=x.full_name);setProfiles(m)}
  setLoading(false);
 }
 useEffect(()=>{load()},[router]);
 async function add(e:React.FormEvent){
  e.preventDefault();setError("");setSaving(true);
  const{data:{user}}=await supabase.auth.getUser();const{data:p}=await supabase.from("profiles").select("college_id").eq("id",user?.id??"").single();
  if(!p?.college_id){setError("Your admin account is not linked to a college yet.");setSaving(false);return;}
  const{data:student}=await supabase.from("students").select("academic_year_id").eq("id",studentId).single();
  if(!student){setError("Student not found.");setSaving(false);return;}
  const{error}=await supabase.from("fees").insert({student_id:studentId,academic_year_id:student.academic_year_id,fee_type:feeType,amount:Number(amount),due_date:due||null});
  if(error)setError(error.message);else{setFeeType("");setAmount("");setDue("");await load()}setSaving(false);
 }
 return <main className="min-h-screen bg-slate-50"><header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4"><Link href="/admin" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18}/></Link><IndianRupee className="text-blue-700"/><h1 className="font-black text-[#102a43]">Fees</h1></div></header><div className="mx-auto max-w-6xl px-5 py-8">
 <form onSubmit={add} className="rounded-2xl border bg-white p-6"><h2 className="font-black">Add fee record</h2><div className="mt-4 grid gap-3 md:grid-cols-4"><select required value={studentId} onChange={e=>setStudentId(e.target.value)} className="rounded-xl border px-4 py-3"><option value="">Student</option>{students.map(x=><option key={x.id} value={x.id}>{x.admission_number} — {profiles[x.profile_id]??"Student"}</option>)}</select><input required value={feeType} onChange={e=>setFeeType(e.target.value)} placeholder="Tuition Fee" className="rounded-xl border px-4 py-3 outline-none"/><input required type="number" min="0" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount" className="rounded-xl border px-4 py-3 outline-none"/><input type="date" value={due} onChange={e=>setDue(e.target.value)} className="rounded-xl border px-4 py-3"/></div>{error&&<p className="mt-3 text-sm text-red-600">{error}</p>}<button disabled={saving} className="mt-4 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{saving?"Saving...":"Add Fee"}</button></form>
 <div className="mt-6 overflow-hidden rounded-2xl border bg-white">{loading?<div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-700"/></div>:rows.length?<table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">Fee</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y">{rows.map(r=>{const s=students.find(x=>x.id===r.student_id);return <tr key={r.id}><td className="px-5 py-4 font-bold">{s?profiles[s.profile_id]??s.admission_number:"Student"}</td><td className="px-5 py-4">{r.fee_type}</td><td className="px-5 py-4">₹{Number(r.amount).toLocaleString("en-IN")}</td><td className="px-5 py-4 capitalize">{r.status}</td></tr>})}</tbody></table>:<p className="p-10 text-center text-sm text-slate-500">No fee records found.</p>}</div>
 </div></main>
}
