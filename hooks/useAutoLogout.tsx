"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function useAutoLogout(timeoutMs = 1 * 60 * 1000) { 
  const router = useRouter();

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        await supabase.auth.signOut();
        router.push("/login");
      }, timeoutMs);
    };

    // Reset on user activity
    const events = ["mousemove", "keydown", "click"];
    events.forEach((event) => document.addEventListener(event, resetTimer));

    resetTimer(); // Start timer initially

    return () => {
      clearTimeout(timeout);
      events.forEach((event) => document.removeEventListener(event, resetTimer));
    };
  }, [router, timeoutMs]);
}
