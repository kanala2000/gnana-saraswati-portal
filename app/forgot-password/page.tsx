"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function ForgotPassword(){
 const[email,setEmail]=useState("");const[loading,setLoading]=useState(false);const[msg,setMsg]=useState("");const[error,setError]=useState("");
 async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setMsg("");setError("");const{error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/reset-password`});if(error)setError(error.message);else setMsg("If this email is registered, a password reset link has been sent.");setLoading(false)}
 return <main className="min-h-screen bg-slate-50"><div className="mx-auto flex min-h-screen max-w-md items-center px-5"><section className="w-full rounded-3xl border bg-white p-7 shadow-xl"><Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-blue-700"><ArrowLeft size={16}/> Back to login</Link><h1 className="mt-8 text-3xl font-black text-[#102a43]">Reset password</h1><p className="mt-2 text-sm leading-6 text-slate-500">Enter your registered college portal email and we'll send a secure reset link.</p><form onSubmit={submit} className="mt-7 space-y-4"><label className="block"><span className="mb-2 block text-sm font-bold">Email</span><div className="flex items-center gap-2 rounded-xl border px-4 py-3"><Mail size={18} className="text-slate-400"/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full outline-none" placeholder="registered email"/></div></label>{error&&<p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{msg&&<p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{msg}</p>}<button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-3.5 font-bold text-white disabled:opacity-50">{loading&&<Loader2 size={17} className="animate-spin"/>}{loading?"Sending...":"Send reset link"}</button></form></section></div></main>
}