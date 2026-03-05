"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  XCircle,
  History,
  QrCode,
  Users,
  ChevronRight,
  Hash
} from "lucide-react";
import BarcodeScanner from "@/components/BarcodeScanner";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbysdVJnu6DktedtQNBdlAkgKJ55kAjAtv8BDTVDBoeG7fA-_Q_H289dty4vBD_YOctIXQ/exec";

interface ScanHistory {
  id: string;
  user_id: string;
  nama_user: string;
  nim_user: string;
  scan_number: number;
  timestamp: Date;
  status: "success" | "error";
  message?: string;
}

interface BatchUser {
  uid?: string;
  user_id?: string;
  name?: string;
  nama_user?: string;
  nim?: string;
  nim_user?: string;
  did?: string;
  cid?: string;
  sid?: string;
}

export default function ScannerPage() {
  const [allUsers, setAllUsers] = useState<BatchUser[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  const [lastScan, setLastScan] = useState<ScanHistory | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [totalScans, setTotalScans] = useState<number>(0);

  useEffect(() => {
    const savedHistory = localStorage.getItem("scanHistory");
    if (savedHistory) {
      const history = JSON.parse(savedHistory).map((item: Record<string, unknown>) => ({
        ...item,
        timestamp: new Date(item.timestamp as string | number)
      }));
      setScanHistory(history);
      setTotalScans(history.length);
    }

    const scannedNIMs = JSON.parse(localStorage.getItem('scannedNIMs') || '[]');
    console.log('Scanned NIMs:', scannedNIMs);
  }, []);

  const handleScan = async (decodedText: string) => {
    setIsSending(true);

    try {
      const qrData = JSON.parse(decodedText);
      const batchId = qrData.batch_id || "ABSENSI-001";

      const response = await fetch(`${APPS_SCRIPT_URL}?action=getBatch&batch_id=${batchId}`);
      const batchData = await response.json();

      if (!batchData.users || batchData.users.length === 0) {
        throw new Error("Data batch tidak ditemukan");
      }

      if (!isDataLoaded) {
        setAllUsers(batchData.users);
        setIsDataLoaded(true);
      }

      const scannedNIMs = JSON.parse(localStorage.getItem('scannedNIMs') || '[]');
      const nextIndex = scannedNIMs.length;

      if (nextIndex >= batchData.users.length) {
        alert("Semua data sudah discan!");
        return;
      }

      const currentUser = batchData.users[nextIndex];
      setCurrentIndex(nextIndex);

      const scanData = {
        batch_id: batchId,
        scan_number: nextIndex + 1,
        nim_user: currentUser.nim,
        nama_user: currentUser.name,
        user_id: currentUser.uid,
        device_id: currentUser.did,
        course_id: currentUser.cid,
        session_id: currentUser.sid,
        scanned_at: new Date().toISOString(),
      };

      const formData = new URLSearchParams();
      formData.append("action", "record_scan");
      formData.append("data", JSON.stringify(scanData));

      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: formData,
      });

      scannedNIMs.push(currentUser.nim);
      localStorage.setItem('scannedNIMs', JSON.stringify(scannedNIMs));

      const newScan: ScanHistory = {
        id: Date.now().toString(),
        user_id: currentUser.uid || currentUser.user_id || "N/A",
        nama_user: currentUser.name || currentUser.nama_user || "N/A",
        nim_user: currentUser.nim || currentUser.nim_user || "N/A",
        scan_number: nextIndex + 1,
        timestamp: new Date(),
        status: "success"
      };

      setScanHistory(prev => {
        const updated = [newScan, ...prev].slice(0, 20);
        localStorage.setItem("scanHistory", JSON.stringify(updated));
        return updated;
      });

      setLastScan(newScan);
      setTotalScans(prev => prev + 1);

      if (nextIndex + 1 < batchData.users.length) {
        setCurrentIndex(nextIndex + 1);
      } else {
        alert("Semua data telah discan!");
      }

      if (navigator.vibrate) navigator.vibrate(100);

    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSending(false);
    }
  };

  const clearHistory = () => {
    setScanHistory([]);
    setTotalScans(0);
    localStorage.removeItem("scanHistory");
  };

  const resetScanner = () => {
    setAllUsers([]);
    setIsDataLoaded(false);
    setCurrentIndex(0);
    localStorage.removeItem('scannedNIMs');
    localStorage.removeItem('scanHistory');
    setScanHistory([]);
    setTotalScans(0);
    setLastScan(null);
    alert("Scanner direset. Scan QR Code lagi untuk memulai dari awal.");
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 relative overflow-hidden font-sans">
      {/* Animated Deep Background Elements (Modern Aesthetic) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none" />

      {/* Navigation - Glassmorphic Header */}
      <div className="sticky top-0 z-50 bg-slate-900/60 backdrop-blur-xl border-b border-slate-700/50 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <Link
              href="/"
              className="flex items-center text-slate-300 hover:text-white transition group"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-semibold tracking-wide">Kembali</span>
            </Link>

            <button
              onClick={resetScanner}
              className="text-xs font-semibold px-4 py-2 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 text-red-400 rounded-full hover:bg-red-500/20 hover:text-red-300 transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)] active:scale-95"
            >
              Reset Scanner
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 pt-4">
            <div className="inline-flex items-center justify-center p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)] mb-2">
              <QrCode className="w-10 h-10 text-blue-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 tracking-tight">
              Scanner Absensi Berurutan
            </h1>
            <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-base font-medium">
              Arahkan kamera ke QR Code master - Data akan tersimpan otomatis dan berjalan sequential.
            </p>
          </div>

          {/* Progress & Data Stats (Glassmorphic Cards) */}
          {isDataLoaded && (
            <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl border border-slate-700/50 p-6 md:p-8 shadow-2xl">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-200">Progress Scan</h3>
                  <p className="text-sm text-slate-400">{currentIndex} dari {allUsers.length} selesai</p>
                </div>
                <span className="text-2xl font-black text-blue-400">
                  {Math.round((currentIndex / allUsers.length) * 100)}<span className="text-sm text-blue-500">%</span>
                </span>
              </div>

              <div className="w-full bg-slate-900 rounded-full h-3 mb-8 overflow-hidden border border-slate-700">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  style={{ width: `${(currentIndex / allUsers.length) * 100}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-3 gap-3 md:gap-6">
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-blue-500/20 text-center shadow-inner group hover:bg-slate-800/80 transition-colors">
                  <Hash className="w-5 h-5 text-blue-400 mx-auto mb-2 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Ke-</p>
                  <p className="text-2xl md:text-3xl font-bold text-blue-300">{currentIndex + 1}</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-green-500/20 text-center shadow-inner group hover:bg-slate-800/80 transition-colors">
                  <Users className="w-5 h-5 text-green-400 mx-auto mb-2 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Total</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-300">{allUsers.length}</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-purple-500/20 text-center shadow-inner group hover:bg-slate-800/80 transition-colors">
                  <ChevronRight className="w-5 h-5 text-purple-400 mx-auto mb-2 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Sisa</p>
                  <p className="text-2xl md:text-3xl font-bold text-purple-300">
                    {Math.max(0, allUsers.length - currentIndex)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Scanner Block */}
            <div className="lg:col-span-7">
              <div className="bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 md:p-8 shadow-2xl h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-3 rounded-xl border border-green-500/30">
                      <Camera className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">Kamera Scanner</h2>
                      <p className="text-sm text-slate-400 mt-1">
                        {isDataLoaded
                          ? `Ready: ${allUsers[currentIndex]?.name || allUsers[currentIndex]?.nama_user || 'Menunggu'}`
                          : "Scan QR Master untuk Inisialisasi"}
                      </p>
                    </div>
                  </div>

                  {isSending && (
                    <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                      <span className="text-xs font-semibold text-blue-300 tracking-wide uppercase">Processing</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 flex items-center justify-center p-2">
                  <BarcodeScanner onScan={handleScan} />
                </div>
              </div>
            </div>

            {/* Sidebar: Result & History */}
            <div className="lg:col-span-5 space-y-8">
              {/* Last Scan Result Card */}
              {lastScan && (
                <div
                  className={`bg-slate-800/80 backdrop-blur-md rounded-3xl border-2 p-6 shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 ${lastScan.status === "success"
                      ? "border-green-500/40 shadow-[0_0_30px_rgba(74,222,128,0.15)]"
                      : "border-red-500/40 shadow-[0_0_30px_rgba(248,113,113,0.15)]"
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl ${lastScan.status === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {lastScan.status === "success" ? (
                        <CheckCircle className="w-8 h-8 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-8 h-8 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-white mb-3">
                        {lastScan.status === "success"
                          ? `Scan #${lastScan.scan_number} Diterima`
                          : "Scan Ditolak"}
                      </h3>
                      {lastScan.status === "success" ? (
                        <div className="grid grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-700/50">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Nama</p>
                            <p className="font-semibold text-sm text-slate-200 line-clamp-1">{lastScan.nama_user}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">NIM</p>
                            <p className="font-mono text-sm text-blue-300">{lastScan.nim_user}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-red-400 mt-1 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{lastScan.message}</p>
                      )}
                      <p className="text-[11px] text-slate-500 mt-4 flex justify-between items-center">
                        <span>ID: {lastScan.user_id}</span>
                        <span>{lastScan.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Scan History list */}
              {scanHistory.length > 0 && (
                <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl border border-slate-700/50 shadow-xl overflow-hidden flex flex-col max-h-[400px]">
                  <div className="flex justify-between items-center p-5 border-b border-slate-700/50 bg-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-700/50 p-2 rounded-lg text-slate-300">
                        <History className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">Aktivitas Terakhir</h3>
                        <p className="text-xs text-slate-400">{totalScans} total record</p>
                      </div>
                    </div>
                    <button
                      onClick={clearHistory}
                      className="text-xs font-semibold text-slate-400 hover:text-red-400 transition hover:bg-red-500/10 px-3 py-1.5 rounded-lg"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                    {scanHistory.map((scan) => (
                      <div
                        key={scan.id}
                        className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-700/40 transition-colors border border-transparent hover:border-slate-600/50"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div
                            className={`p-1.5 rounded-full ${scan.status === "success"
                                ? "bg-green-500/10 text-green-400"
                                : "bg-red-500/10 text-red-400"
                              }`}
                          >
                            {scan.status === "success" ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-200 truncate">
                              <span className="text-slate-500 text-xs mr-1 opacity-60">#{scan.scan_number}</span>
                              {scan.nama_user}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono tracking-wider truncate">
                              {scan.nim_user}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition whitespace-nowrap ml-2">
                          {scan.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pb-8"></div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(71, 85, 105, 0.4);
            border-radius: 20px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
            background-color: rgba(71, 85, 105, 0.8);
        }
      `}</style>
    </div>
  );
}
