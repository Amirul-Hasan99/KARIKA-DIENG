"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { formatRupiah } from "@/lib/utils";
import Flaticon from "@/components/ui/Flaticon";

interface QrisDisplayProps {
  orderNumber: string;
  totalAmount: number;
  tableNumber: string;
  customerName?: string;
  customerId?: string;
}

export default function QrisDisplay({
  orderNumber,
  totalAmount,
  tableNumber,
  customerName,
  customerId,
}: QrisDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // 15 minutes countdown

  // Generate QR Code data URL
  useEffect(() => {
    // Standardized QR payload format representation
    const qrPayload = `00020101021226670016ID.CO.MIDTRANS.WWW011893600503000008988551440014ID.GO.QRIS.WWW0215ID10203040506010303UME520458125303360540${String(totalAmount)}.005802ID5919KOPI & SNACK BAR6007JAKARTA62${String(orderNumber.length).padStart(2, "0")}${orderNumber}6304`;

    QRCode.toDataURL(
      qrPayload,
      {
        width: 320,
        margin: 1.5,
        color: {
          dark: "#0f172a", // slate-900
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [orderNumber, totalAmount]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  return (
    <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-2xl border-2 border-red-500/20 bg-white shadow-xl">
      {/* Official QRIS Header */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 px-4 py-2.5 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Official styled QRIS text emblem */}
          <div className="bg-white px-2 py-0.5 rounded shadow-xs">
            <span className="font-black text-red-600 tracking-tighter text-sm">QRIS</span>
          </div>
          <span className="text-[10px] font-medium tracking-wide uppercase text-red-100">
            Standar Pembayaran Nasional
          </span>
        </div>
        <div className="flex items-center gap-1 bg-red-800/60 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider">
          <span>GPN</span>
        </div>
      </div>

      {/* Merchant Details */}
      <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200/80 text-center">
        <h4 className="text-xs font-black tracking-wide text-slate-900 uppercase">
          KOPI & SNACK COFFEE BAR
        </h4>
        <div className="flex items-center justify-center gap-2 mt-0.5 text-[10px] text-slate-500">
          <span>NMID: <strong className="font-mono text-slate-700">ID1020304050601</strong></span>
          <span>•</span>
          <span>A01 (Midtrans)</span>
        </div>
      </div>

      {/* QR Code Presentation Box */}
      <div className="p-4 flex flex-col items-center bg-white">
        <div className="relative p-2 bg-white rounded-xl border-2 border-slate-200/80 shadow-xs">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QRIS Payment ${orderNumber}`}
              className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
            />
          ) : (
            <div className="w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center bg-slate-50 text-slate-400">
              <span className="text-xs font-semibold">Membuat QRIS...</span>
            </div>
          )}

          {/* Center QRIS logo badge */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/95 px-1.5 py-0.5 rounded border border-red-500 shadow-xs">
              <span className="text-[9px] font-black tracking-tight text-red-600">QRIS</span>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="mt-3 text-center">
          <p className="text-[11px] font-medium text-slate-500">Total Tagihan</p>
          <p className="text-xl font-black text-slate-900 tracking-tight text-amber-600">
            {formatRupiah(totalAmount)}
          </p>
        </div>

        {/* Order Details Mini-Pill */}
        <div className="mt-2.5 w-full rounded-xl bg-slate-50 p-2 text-[11px] border border-slate-200/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">ID Pembeli:</span>
            <span className="font-mono font-black text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
              {customerId || `CUST-${tableNumber}`}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Meja: <strong className="text-slate-900 font-bold">Meja {tableNumber}</strong></span>
            <span className="font-mono font-bold text-slate-700">{orderNumber}</span>
          </div>
        </div>

        {/* Timer countdown */}
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <Flaticon name="time-fast" className="text-xs text-amber-500 animate-pulse" />
          <span>
            Kadaluarsa dalam:{" "}
            <strong className="font-mono text-slate-800 font-bold">{formattedTime}</strong>
          </span>
        </div>
      </div>

      {/* Supported Apps Banner */}
      <div className="bg-slate-50 px-4 py-2 text-center border-t border-slate-100">
        <p className="text-[9px] text-slate-500 leading-relaxed">
          BCA Mobile, Livin&apos; Mandiri, BRImo, GoPay, OVO, DANA, ShopeePay &amp; Semua m-Banking.
        </p>
      </div>
    </div>
  );
}
