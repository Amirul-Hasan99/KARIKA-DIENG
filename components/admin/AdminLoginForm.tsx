"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flaticon } from "@/components/ui/Flaticon";
import { BrandLogoIcon } from "@/components/ui/BrandLogo";

export default function AdminLoginForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Tidak dapat masuk.");
      // Use replace to prevent back button from returning to login form
      window.location.replace("/admin");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Terjadi gangguan. Coba lagi.");
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#F8F7F0] px-4 py-10 text-[#292929]">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#77756f] hover:text-[#292929] transition"
        >
          <Flaticon name="arrow-left" className="text-xs" />
          <span>Kembali ke katalog</span>
        </Link>
        <Card className="rounded-3xl shadow-sm border border-[#e8e5dc]">
          <CardHeader className="space-y-4 p-7 pb-5 sm:p-8 sm:pb-5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#292a23] text-[#f4ce00] shadow-sm">
              <BrandLogoIcon size={24} color="#f4ce00" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                Masuk Admin Dioleh - oleh Dieng
              </CardTitle>
              <CardDescription className="mt-2 leading-6">
                Area operasional pengantaran dan pesanan oleh-oleh Dieng.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-7 pt-2 sm:p-8 sm:pt-2">
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  autoComplete="username"
                  id="username"
                  name="username"
                  required
                  maxLength={100}
                  placeholder="Masukkan username admin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  autoComplete="current-password"
                  id="password"
                  name="password"
                  type="password"
                  required
                  maxLength={200}
                  placeholder="••••••••••••"
                />
              </div>
              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700 font-medium"
                >
                  {error}
                </p>
              )}
              <Button
                type="submit"
                size="lg"
                disabled={busy}
                className="w-full bg-[#292a23] hover:bg-black text-white font-semibold gap-2"
              >
                {busy ? (
                  <>
                    <Flaticon name="spinner" className="animate-spin text-sm" />
                    <span>Memeriksa…</span>
                  </>
                ) : (
                  <>
                    <Flaticon name="key" variant="sr" className="text-sm" />
                    <span>Masuk ke Dashboard</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-[#858585]">
          Dioleh - oleh Dieng · Panel Terproteksi
        </p>
      </div>
    </main>
  );
}
