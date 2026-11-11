"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const [isVerifying, setIsVerifying] = useState(!isLoginPage);

  useEffect(() => {
    if (isLoginPage) return;

    // 1. Anti-bfcache (Back-Forward Cache): If restored from cache, force fresh reload
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", handlePageShow);

    // 2. Validate session on mount
    let isMounted = true;
    const verifySession = async () => {
      try {
        const res = await fetch("/api/admin/orders", {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
          cache: "no-store",
        });

        if (!res.ok) {
          // Token expired or invalid: immediately replace history state with login
          window.location.replace("/admin/login");
          return;
        }

        if (isMounted) {
          setIsVerifying(false);
        }
      } catch {
        window.location.replace("/admin/login");
      }
    };

    void verifySession();

    // 3. Browser Back/Forward (Undo/Redo) history guard
    const handlePopState = () => {
      void verifySession();
    };
    window.addEventListener("popstate", handlePopState);

    // 4. Inactivity auto-lock (60 minutes)
    let timeoutId: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          await fetch("/api/admin/logout", { method: "POST" });
        } catch {}
        window.location.replace("/admin/login?reason=timeout");
      }, 60 * 60 * 1000);
    };

    const userEvents = ["mousedown", "keydown", "scroll", "touchstart"];
    userEvents.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("popstate", handlePopState);
      userEvents.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [isLoginPage, pathname]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f8f7f2] text-[#292a23]">
        <div className="flex flex-col items-center gap-3">
          <i className="fi fi-rr-lock text-3xl text-amber-600 animate-pulse" />
          <p className="text-sm font-semibold text-slate-700">
            Memverifikasi keamanan sesi admin...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
