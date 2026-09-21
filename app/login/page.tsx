"use client";

import { useState } from "react";
import { ArrowLeft, GraduationCap, LockKeyhole, Mail, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("Student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError || !data.user) {
      setError(loginError?.message || "Login failed. Please check your credentials.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setError("Profile not found. Please contact the college administrator.");
      setLoading(false);
      return;
    }

    const selectedRole = role.toLowerCase();
    if (profile.role !== selectedRole) {
      await supabase.auth.signOut();
      setError(`This account is registered as ${profile.role}, not ${selectedRole}.`);
      setLoading(false);
      return;
    }

    router.push(`/${profile.role}`);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-10 md:grid-cols-2">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-blue-700"><ArrowLeft size={16} /> Back to website</Link>
          <div className="mt-12 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#102a43] text-white"><GraduationCap /></div>
          <p className="mt-6 text-sm font-extrabold uppercase tracking-[.2em] text-blue-700">Gnana Saraswati Jr. College</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-[#102a43]">Portal Login</h1>
          <p className="mt-4 max-w-md leading-7 text-slate-600">Sign in to the college portal using your registered account.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl">
          <div className="grid grid-cols-3 rounded-xl bg-slate-100 p-1">
            {["Student", "Faculty", "Admin"].map((item) => (
              <button type="button" key={item} onClick={() => { setRole(item); setError(""); }} className={`rounded-lg px-3 py-2 text-sm font-bold ${role === item ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>
                {item}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="mt-7 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Email</span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3">
                <Mail size={18} className="text-slate-400" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full outline-none" placeholder="student@gnanasaraswati.edu" />
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Password</span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3">
                <LockKeyhole size={18} className="text-slate-400" />
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="w-full outline-none" placeholder="••••••••" />
              </div>
            </label>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-3.5 font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? "Signing in..." : `Continue as ${role}`}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-400">Secure authentication powered by Supabase.</p>
        </div>
      </div>
    </main>
  );
}
