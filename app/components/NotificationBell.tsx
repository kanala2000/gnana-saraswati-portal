"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function NotificationBell() {
  const [count, setCount] = useState(0);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { count: unread } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_profile_id", user.id)
      .eq("is_read", false);
    setCount(unread ?? 0);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("notifications-bell")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <Link href="/notifications" aria-label="Notifications" className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50">
      <Bell size={18} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1 text-center text-[10px] font-black leading-5 text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
