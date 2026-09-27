"use client";

import { useEffect,useState } from "react";
import Link from "next/link";
import { ArrowLeft,Bell,Loader2,Plus,Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Notice={id:string;title:string;body:string;audience:string;published_at:string;expires_at:string|null};

export default function AdminNoticesPage(){
 const router=useRouter();const[rows,setRows]=useState<Notice[]>([]);const[title,setTitle]=useState("");const[body,setBody]=useState("");const[audience,setAudience]=useState("all");const[expires,setExpires]=useState("");const[loading,setLoading]=useState(true);const[saving,setSaving]=useState(false);const[error,setError]=useState("");
 async function load(){
  const{data:{session}}=await supabase.auth.getSession();if(!session?.user){router.replace("/login");return;}
  const{data:p}=await supabase.from("profiles").select("role").eq("id",session.user.id).single();
  if(!p||!["admin","principal"].includes(p.role)){await supabase.auth.signOut();router.replace("/login");return;}
  const{data}=await supabase.from("notices").select("id,title,body,audience,published_at,expires_at").order("published_at",{ascending:false});setRows(data??[]);setLoading(false);
 }
 useEffect(()=>{load()},[router]);
 async function add(e:React.FormEvent){
  e.preventDefault();setError("");setSaving(true);
  const{data:{user}}=await supabase.auth.getUser();
  const{data:p}=await supabase.from("profiles").select("college_id").eq("id",user?.id??"").single();
  if(!p?.college_id){setError("Your admin account is not linked to a college yet.");setSaving(false);return;}
  const{error}=await supabase.from("notices").insert({college_id:p.college_id,title,body,audience,expires_at:expires?new Date(expires).toISOString():null,created_by:user?.id});
  if(error)setError(error.message);else{setTitle("");setBody("");setExpires("");await load()}setSaving(false);
 }
 async function remove(id:string){if(!confirm("Delete this notice?"))return;const{error}=await supabase.from("notices").delete().eq("id",id);if(error)setError(error.message);else load();}
 return <main className="min-h-screen bg-slate-50"><header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4"><Link href="/admin" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18}/></Link><Bell className="text-blue-700"/><h1 className="font-black text-[#102a43]">Notices</h1></div></header><div className="mx-auto max-w-6xl px-5 py-8">
 <form onSubmit={add} className="rounded-2xl border bg-white p-6"><h2 className="font-black">Publish notice</h2><div className="mt-4 grid gap-3 md:grid-cols-2"><input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Notice title" className="rounded-xl border px-4 py-3 outline-none"/><select value={audience} onChange={e=>setAudience(e.target.value)} className="rounded-xl border px-4 py-3"><option value="all">All</option><option value="students">Students</option><option value="faculty">Faculty</option><option value="admin">Admin</option></select></div><textarea required value={body} onChange={e=>setBody(e.target.value)} placeholder="Official notice content" rows={5} className="mt-3 w-full rounded-xl border px-4 py-3 outline-none"/><input type="datetime-local" value={expires} onChange={e=>setExpires(e.target.value)} className="mt-3 rounded-xl border px-4 py-3"/>{error&&<p className="mt-3 text-sm text-red-600">{error}</p>}<button disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Plus size={16}/>{saving?"Publishing...":"Publish Notice"}</button></form>
 <div className="mt-6 space-y-4">{loading?<div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-700"/></div>:rows.length?rows.map(r=><article key={r.id} className="rounded-2xl border bg-white p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase text-blue-700">{r.audience}</p><h2 className="mt-1 text-xl font-black text-[#102a43]">{r.title}</h2><p className="mt-1 text-xs text-slate-500">{new Date(r.published_at).toLocaleString()}</p></div><button onClick={()=>remove(r.id)} className="text-red-600"><Trash2 size={17}/></button></div><p className="mt-4 whitespace-pre-wrap leading-7 text-slate-600">{r.body}</p></article>):<div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">No notices published.</div>}</div>
 </div></main>
}
