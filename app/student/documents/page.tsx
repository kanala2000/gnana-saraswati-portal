"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, IdCard, IndianRupee, Loader2, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function StudentDocumentsPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data } = await supabase.from("profiles").select("full_name,role,is_active").eq("id", user.id).single();
      if (!data || data.role !== "student" || data.is_active === false) {
        await supabase.auth.signOut(); router.replace("/login"); return;
      }
      setName(data.full_name);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-700"/></main>;

  const docs = [
    { title:"Student ID Card", text:"Open and print your current college identity card.", href:"/student/id-card", icon:IdCard },
    { title:"Report Card", text:"View examination performance in a printable format.", href:"/student/report-card", icon:FileText },
    { title:"Fee Statement", text:"View fee records and print your fee statement.", href:"/student/fees", icon:IndianRupee },
  ];

  return <main className="min-h-screen bg-slate-50">
    <header className="border-b bg-white"><div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-4"><Link href="/student" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18}/></Link><FileText className="text-blue-700"/><div><h1 className="font-black text-[#102a43]">My Documents</h1><p className="text-xs text-slate-500">{name}</p></div></div></header>
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="grid gap-4 md:grid-cols-3">
        {docs.map(({title,text,href,icon:Icon})=><Link key={title} href={href} className="rounded-2xl border bg-white p-6 shadow-sm hover:-translate-y-0.5 hover:shadow-md"><Icon className="text-blue-700" size={26}/><h2 className="mt-4 font-black text-[#102a43]">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700"><Printer size={15}/> Open / Print</span></Link>)}
      </div>
      <p className="mt-6 text-center text-xs text-slate-400">Use your browser's print dialog to save a document as PDF when required.</p>
    </div>
  </main>;
}
