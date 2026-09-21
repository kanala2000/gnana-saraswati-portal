"use client";

import { useState } from "react";
import { ArrowLeft, GraduationCap, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [role, setRole] = useState("Student");

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-10 md:grid-cols-2">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-blue-700"><ArrowLeft size={16} /> Back to website</Link>
          <div className="mt-12 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#102a43] text-white"><GraduationCap /></div>
          <p className="mt-6 text-sm font-extrabold uppercase tracking-[.2em] text-blue-700">Gnana Saraswati Jr. College</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-[#102a43]">Portal Login</h1>
          <p className="mt-4 max-w-md leading-7 text-slate-600">Demo login interface for students, faculty and college administration.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl">
          <div className="grid grid-cols-3 rounded-xl bg-slate-100 p-1">
            {["Student", "Faculty", "Admin"].map((item) => (
              <button key={item} onClick={() => setRole(item)} className={`rounded-lg px-3 py-2 text-sm font-bold ${role === item ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>
                {item}
              </button>
            ))}
          </div>
          <form onSubmit={(e) => e.preventDefault()} className="mt-7 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Email / Student ID</span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3"><Mail size={18} className="text-slate-400" /><input className="w-full outline-none" placeholder={role === "Student" ? "student@college.edu" : "name@college.edu"} /></div>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Password</span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3"><LockKeyhole size={18} className="text-slate-400" /><input type="password" className="w-full outline-none" placeholder="••••••••" /></div>
            </label>
            <button className="w-full rounded-xl bg-blue-700 py-3.5 font-bold text-white hover:bg-blue-800">Continue as {role}</button>
          </form>
          <p className="mt-5 text-center text-xs text-slate-400">Authentication will be connected to Supabase in the next phase.</p>
        </div>
      </div>
    </main>
  );
}
