"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, IndianRupee, Loader2, Users, GraduationCap, ClipboardCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Bar={label:string;value:number;display?:string};
const pct=(n:number)=>Number.isFinite(n)?Math.max(0,Math.min(100,n)):0;

export default function PrincipalAnalytics(){
 const router=useRouter();
 const[loading,setLoading]=useState(true);
 const[students,setStudents]=useState(0);
 const[attendance,setAttendance]=useState(0);
 const[fees,setFees]=useState({billed:0,paid:0,balance:0});
 const[courses,setCourses]=useState<Bar[]>([]);
 const[sections,setSections]=useState<Bar[]>([]);
 const[subjects,setSubjects]=useState<Bar[]>([]);
 const[workload,setWorkload]=useState<Bar[]>([]);
 const[error,setError]=useState("");

 useEffect(()=>{(async()=>{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session){router.replace("/login");return}
   const {data:p}=await supabase.from("profiles").select("role,is_active").eq("id",session.user.id).single();
   if(!p||p.role!=="principal"||p.is_active===false){await supabase.auth.signOut();router.replace("/login");return}

   const [st,courseRows,sectionRows,att,feeRows,markRows,faRows,facultyRows]=await Promise.all([
     supabase.from("students").select("id",{count:"exact",head:true}).eq("status","active"),
     supabase.from("courses").select("id,name"),
     supabase.from("sections").select("id,name,course_id"),
     supabase.from("attendance").select("status,student_id,subject_id"),
     supabase.from("fees").select("amount,paid_amount,status"),
     supabase.from("marks").select("marks,max_marks,subject_id"),
     supabase.from("faculty_assignments").select("faculty_id,section_id,subject_id"),
     supabase.from("faculty").select("id,employee_number,profile_id")
   ]);
   if(courseRows.error||sectionRows.error||att.error||feeRows.error||markRows.error||faRows.error){setError("Some analytics data could not be loaded.");}
   setStudents(st.count??0);

   const cr=courseRows.data??[], sr=sectionRows.data??[], ar=att.data??[];
   const byCourse:Bar[]=cr.map(c=>({label:c.name,value:sr.filter(s=>s.course_id===c.id).reduce((n,s)=>n+0,0)}));
   const studentRows=await supabase.from("students").select("section_id,status").eq("status","active");
   for(const c of byCourse){const ids=sr.filter(s=>s.course_id===cr.find(x=>x.name===c.label)?.id).map(s=>s.id);c.value=(studentRows.data??[]).filter(s=>ids.includes(s.section_id)).length}
   setCourses(byCourse.sort((a,b)=>b.value-a.value).slice(0,8));

   const secBars=sr.map(s=>({label:s.name,value:(studentRows.data??[]).filter(x=>x.section_id===s.id).length}));
   setSections(secBars.sort((a,b)=>b.value-a.value).slice(0,10));

   const present=ar.filter(x=>x.status==="present"||x.status==="late").length;
   setAttendance(ar.length?(present/ar.length)*100:0);

   const fr=feeRows.data??[];
   const billed=fr.reduce((n,x)=>n+Number(x.amount||0),0),paid=fr.reduce((n,x)=>n+Number(x.paid_amount||0),0);
   setFees({billed,paid,balance:Math.max(0,billed-paid)});

   const mr=markRows.data??[];
   const subjectRows=await supabase.from("subjects").select("id,name");
   const sb=subjectRows.data??[];
   setSubjects(sb.map(s=>{const rows=mr.filter(x=>x.subject_id===s.id);const avg=rows.length?rows.reduce((n,x)=>n+(Number(x.marks||0)/Number(x.max_marks||1))*100,0)/rows.length:0;return {label:s.name,value:avg,display:rows.length?avg.toFixed(1)+"%":"No marks"}}).filter(x=>x.display!=="No marks").sort((a,b)=>b.value-a.value).slice(0,8));

   const fac=facultyRows.data??[], fas=faRows.data??[];
   const fbars=fac.map(f=>{const count=fas.filter(x=>x.faculty_id===f.id).length;return {label:f.employee_number,value:count}});
   setWorkload(fbars.sort((a,b)=>b.value-a.value).slice(0,10));
   setLoading(false);
 })()},[router]);

 if(loading)return <main className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-700"/></main>;

 const max=(items:Bar[])=>Math.max(...items.map(x=>x.value),1);
 const BarList=({items,suffix=""}:{items:Bar[];suffix?:string})=><div className="mt-4 space-y-4">{items.length?items.map(x=><div key={x.label}><div className="mb-1 flex justify-between gap-4 text-sm"><span className="truncate font-semibold text-slate-700">{x.label}</span><span className="font-black text-[#102a43]">{x.display??(Number.isInteger(x.value)?x.value:x.value.toFixed(1))+suffix}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{width:`${Math.max(4,(x.value/max(items))*100)}%`}}/></div></div>):<p className="text-sm text-slate-500">No data available yet.</p>}</div>;

 return <main className="min-h-screen bg-slate-50">
  <header className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-4"><Link href="/principal" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18}/></Link><BarChart3 className="text-blue-700"/><div><h1 className="font-black text-[#102a43]">Principal Analytics</h1><p className="text-xs text-slate-500">Live operational analytics from the college database</p></div></div></header>
  <div className="mx-auto max-w-7xl px-5 py-8">
   {error&&<div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{error}</div>}
   <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <section className="rounded-2xl border bg-white p-5"><Users className="text-blue-700"/><p className="mt-3 text-sm text-slate-500">Active students</p><p className="text-3xl font-black text-[#102a43]">{students}</p></section>
    <section className="rounded-2xl border bg-white p-5"><ClipboardCheck className="text-blue-700"/><p className="mt-3 text-sm text-slate-500">Attendance rate</p><p className="text-3xl font-black text-[#102a43]">{attendance.toFixed(1)}%</p></section>
    <section className="rounded-2xl border bg-white p-5"><IndianRupee className="text-blue-700"/><p className="mt-3 text-sm text-slate-500">Fees collected</p><p className="text-3xl font-black text-[#102a43]">₹{fees.paid.toLocaleString("en-IN")}</p></section>
    <section className="rounded-2xl border bg-white p-5"><GraduationCap className="text-blue-700"/><p className="mt-3 text-sm text-slate-500">Fee balance</p><p className="text-3xl font-black text-[#102a43]">₹{fees.balance.toLocaleString("en-IN")}</p></section>
   </div>
   <div className="mt-6 grid gap-6 lg:grid-cols-2">
    <section className="rounded-2xl border bg-white p-6"><h2 className="font-black text-[#102a43]">Student strength by course</h2><BarList items={courses}/></section>
    <section className="rounded-2xl border bg-white p-6"><h2 className="font-black text-[#102a43]">Student strength by section</h2><BarList items={sections}/></section>
    <section className="rounded-2xl border bg-white p-6"><h2 className="font-black text-[#102a43]">Subject performance</h2><BarList items={subjects}/></section>
    <section className="rounded-2xl border bg-white p-6"><h2 className="font-black text-[#102a43]">Faculty assignment workload</h2><BarList items={workload} suffix=" assignments"/></section>
   </div>
   <section className="mt-6 rounded-2xl border bg-white p-6"><h2 className="font-black text-[#102a43]">Fee collection position</h2><div className="mt-5 grid gap-4 sm:grid-cols-3"><div><p className="text-xs uppercase font-bold text-slate-400">Billed</p><p className="mt-1 text-xl font-black">₹{fees.billed.toLocaleString("en-IN")}</p></div><div><p className="text-xs uppercase font-bold text-slate-400">Collected</p><p className="mt-1 text-xl font-black">₹{fees.paid.toLocaleString("en-IN")}</p></div><div><p className="text-xs uppercase font-bold text-slate-400">Balance</p><p className="mt-1 text-xl font-black">₹{fees.balance.toLocaleString("en-IN")}</p></div></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{width:`${pct(fees.billed?fees.paid/fees.billed*100:0)}%`}}/></div></section>
   <div className="mt-6"><Link href="/principal/reports" className="font-bold text-blue-700">← Back to institution reports</Link></div>
  </div>
 </main>
}
