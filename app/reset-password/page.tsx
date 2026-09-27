"use client";

import { useEffect, useState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function ResetPassword(){
 const router=useRouter();const[pw,setPw]=useState("");const[confirm,setConfirm]=useState("");const[ready,setReady]=useState(false);const[msg,setMsg]=useState("");const[error,setError]=useState("");const[loading,setLoading]=useState(false);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>setReady(!!data.session))},[]);
 async function submit(e:React.FormEvent){e.preventDefault();if(pw.length<8){setError("Password must be at least 8 characters.");return}if(pw!==confirm){setError("Passwords do not match.");return}setLoading(true);const{error}=await supabase.auth.updateUser({password:pw});if(error)setError(error.message);else{setMsg("Password updated successfully.");setTimeout(()=>router.replace("/login"),1200)}setLoading(false)}
 if(!ready)return <main className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-700"/></main>;
 return <main className="min-h-screen bg-slate-50"><div className="mx-auto flex min-h-screen max-w-md items-center px-5"><section className="w-full rounded-3xl border bg-white p-7 shadow-xl"><h1 className="text-3xl font-black text-[#102a43]">Create new password</h1><p className="mt-2 text-sm text-slate-500">Choose a new password for your college portal account.</p><form onSubmit={submit} className="mt-7 space-y-4"><div className="flex items-center gap-2 rounded-xl border px-4 py-3"><LockKeyhole size={18} className="text-slate-400"/><input required minLength={8} type="password" value={pw} onChange={e=>setPw(e.target.value)} className="w-full outline-none" placeholder="New password"/></div><div className="flex items-center gap-2 rounded-xl border px-4 py-3"><LockKeyhole size={18} className="text-slate-400"/><input required minLength={8} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} className="w-full outline-none" placeholder="Confirm password"/></div>{error&&<p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{msg&&<p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{msg}</p>}<button disabled={loading} className="w-full rounded-xl bg-blue-700 py-3.5 font-bold text-white disabled:opacity-50">{loading?"Updating...":"Update password"}</button></form></section></div></main>
}