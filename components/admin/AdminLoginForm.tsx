"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, LoaderCircle, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: form.get("username"), password: form.get("password") }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Tidak dapat masuk.");
      window.location.assign("/admin");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Terjadi gangguan. Coba lagi.");
      setBusy(false);
    }
  }
  return <main className="grid min-h-screen place-items-center bg-[#F8F7F0] px-4 py-10 text-[#292929]">
    <div className="w-full max-w-md">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#77756f] hover:text-[#292929]"><ArrowLeft className="h-4 w-4"/> Kembali ke katalog</Link>
      <Card className="rounded-3xl shadow-sm">
        <CardHeader className="space-y-4 p-7 pb-5 sm:p-8 sm:pb-5"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff5b8]"><LockKeyhole className="h-5 w-5"/></div><div><CardTitle className="text-2xl">Masuk admin</CardTitle><CardDescription className="mt-2 leading-6">Area operasional Dioleh2. Pembeli tidak perlu masuk untuk melihat katalog.</CardDescription></div></CardHeader>
        <CardContent className="p-7 pt-2 sm:p-8 sm:pt-2"><form onSubmit={submit} className="space-y-5"><div className="space-y-2"><Label htmlFor="username">Username</Label><Input autoComplete="username" id="username" name="username" required maxLength={100} placeholder="Username admin"/></div><div className="space-y-2"><Label htmlFor="password">Password</Label><Input autoComplete="current-password" id="password" name="password" type="password" required maxLength={200} placeholder="Password"/></div>{error&&<p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</p>}<Button type="submit" size="lg" disabled={busy} className="w-full">{busy?<LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>:<KeyRound className="mr-2 h-4 w-4"/>}{busy?"Memeriksa…":"Masuk ke dashboard"}</Button></form><p className="mt-5 text-xs leading-5 text-[#858585]">Kredensial admin disimpan pada environment server. Jangan bagikan password melalui chat atau simpan di kode sumber.</p></CardContent>
      </Card>
      <p className="mt-6 text-center text-xs text-[#858585]">Dioleh2 · Dashboard hanya untuk petugas berwenang</p>
    </div>
  </main>;
}
