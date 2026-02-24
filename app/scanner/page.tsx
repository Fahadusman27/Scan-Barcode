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
  Download,
  Smartphone,
  ChevronRight,
  Hash
} from "lucide-react";
import BarcodeScanner from "@/components/BarcodeScanner";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzMyfd1oLdIvaTzgmFZffOGG5fq6MwHMTfqQF7OFoLCbER5oVkIGqUMoCy_PkPECXK2eg/exec";

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

export default function ScannerPage() {
  // State untuk data dari QR Code
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  // State untuk scan
  const [lastScan, setLastScan] = useState<ScanHistory | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [totalScans, setTotalScans] = useState<number>(0);

  // Load history dari localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("scanHistory");
    if (savedHistory) {
      const history = JSON.parse(savedHistory).map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
      setScanHistory(history);
      setTotalScans(history.length);
    }

    // Load scanned NIMs dari localStorage untuk sync dengan barcode page
    const scannedNIMs = JSON.parse(localStorage.getItem('scannedNIMs') || '[]');
    console.log('Scanned NIMs:', scannedNIMs);
  }, []);

  const handleScan = async (decodedText: string) => {
    setIsSending(true);

    try {
      // Parse QR Code (hanya berisi batch_id)
      const qrData = JSON.parse(decodedText);
      const batchId = qrData.batch_id || "ABSENSI-001";

      // Ambil data dari Apps Script berdasarkan batch_id
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getBatch&batch_id=${batchId}`);
      const batchData = await response.json();

      if (!batchData.users || batchData.users.length === 0) {
        throw new Error("Data batch tidak ditemukan");
      }

      // Hitung urutan scan berdasarkan yang sudah discan
      const scannedNIMs = JSON.parse(localStorage.getItem('scannedNIMs') || '[]');
      const nextIndex = scannedNIMs.length;

      if (nextIndex >= batchData.users.length) {
        alert("Semua data sudah discan!");
        return;
      }

      const currentUser = batchData.users[nextIndex];

      // Kirim data scan ke Apps Script
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

      // Simpan di localStorage
      scannedNIMs.push(currentUser.nim);
      localStorage.setItem('scannedNIMs', JSON.stringify(scannedNIMs));

      // Tampilkan hasil
      const newScan: ScanHistory = {
        id: Date.now().toString(),
        user_id: currentUser.uid || currentUser.user_id || "N/A",
        nama_user: currentUser.name || currentUser.nama_user || "N/A",
        nim_user: currentUser.nim || currentUser.nim_user || "N/A",
        scan_number: nextIndex + 1,
        timestamp: new Date(),
        status: "success"
      };

      setLastScan(newScan);

    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Fungsi terpisah untuk proses scan
  const processScan = async (currentUser: any, scanNumber: number, usersList: any[]) => {
    // Kirim data dengan nomor urut
    const scanData = {
      scan_number: scanNumber,
      nim_user: currentUser.nim_user,
      nama_user: currentUser.nama_user,
      user_id: currentUser.user_id,
      device_id: currentUser.device_id,
      course_id: currentUser.course_id,
      session_id: currentUser.session_id,
      scanned_at: new Date().toISOString(),
    };

    console.log('Mengirim data:', scanData);

    const formData = new URLSearchParams();
    formData.append("barcode_data", JSON.stringify(scanData));

    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });

    // Simpan NIM yang sudah discan ke localStorage untuk sinkronisasi dengan barcode page
    const scannedNIMs = JSON.parse(localStorage.getItem('scannedNIMs') || '[]');
    if (!scannedNIMs.includes(currentUser.nim_user)) {
      scannedNIMs.push(currentUser.nim_user);
      localStorage.setItem('scannedNIMs', JSON.stringify(scannedNIMs));
    }

    // Catat history scan
    // Catat history
    const newScan: ScanHistory = {
      id: Date.now().toString(),
      user_id: currentUser.user_id,
      nama_user: currentUser.nama_user,
      nim_user: currentUser.nim_user,
      scan_number: scanNumber,
      timestamp: new Date(),
      status: "success",
    };

    setScanHistory(prev => {
      const updated = [newScan, ...prev].slice(0, 20);
      localStorage.setItem("scanHistory", JSON.stringify(updated));
      return updated;
    });

    setLastScan(newScan);
    setTotalScans(prev => prev + 1);

    // Update index
    if (scanNumber < usersList.length) {
      setCurrentIndex(scanNumber);
    } else {
      setCurrentIndex(0);
      alert("Semua data telah discan! Kembali ke awal.");
    }

    if (navigator.vibrate) navigator.vibrate(100);
  };

  const clearHistory = () => {
    setScanHistory([]);
    setTotalScans(0);
    localStorage.removeItem("scanHistory");
    // Tidak hapus scannedNIMs karena untuk sync dengan barcode
  };

  const resetScanner = () => {
    setAllUsers([]);
    setIsDataLoaded(false);
    setCurrentIndex(0);
    localStorage.removeItem('scannedNIMs');
    localStorage.removeItem('scanHistory');
    setScanHistory([]);
    setTotalScans(0);
    alert("Scanner direset. Scan QR Code lagi untuk memulai dari awal.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="flex items-center text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Kembali</span>
            </Link>

            <button
              onClick={resetScanner}
              className="text-sm px-3 py-1 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200 transition"
            >
              Reset Scanner
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
              <QrCode className="w-8 h-8 text-blue-600" />
              Scanner Absensi Berurutan
            </h1>
            <p className="text-gray-600">
              Scan QR Code master - Data akan keluar berurutan dari ID 1, 2, 3, ...
            </p>
          </div>

          {/* Status Card */}
          {isDataLoaded && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <Hash className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Scan Ke-</p>
                  <p className="text-2xl font-bold text-blue-700">{currentIndex + 1}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <Users className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Total Data</p>
                  <p className="text-2xl font-bold text-green-700">{allUsers.length}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <ChevronRight className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Sisa</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {allUsers.length - (currentIndex + 1)}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress Scan</span>
                  <span>{Math.round(((currentIndex + 1) / allUsers.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / allUsers.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Scanner Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Camera className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Scan QR Code</h2>
                  <p className="text-sm text-gray-500">
                    {isDataLoaded
                      ? `Scan untuk data ke-${currentIndex + 1} (${allUsers[currentIndex]?.nama_user || '-'})`
                      : "Scan QR Code master untuk memulai"}
                  </p>
                </div>
              </div>
              {isSending && (
                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                  <span className="text-sm text-blue-600">Mengirim data...</span>
                </div>
              )}
            </div>

            <BarcodeScanner onScan={handleScan} />
          </div>

          {/* Last Scan Result */}
          {lastScan && (
            <div
              className={`bg-white rounded-2xl shadow-xl p-6 mb-6 border-l-8 ${lastScan.status === "success"
                  ? "border-green-500"
                  : "border-red-500"
                }`}
            >
              <div className="flex items-start gap-4">
                {lastScan.status === "success" ? (
                  <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {lastScan.status === "success"
                      ? `Scan #${lastScan.scan_number} Berhasil`
                      : "Scan Gagal"}
                  </h3>
                  {lastScan.status === "success" ? (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-500">NIM</p>
                        <p className="font-mono font-medium">{lastScan.nim_user}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Nama</p>
                        <p className="font-medium">{lastScan.nama_user}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">User ID</p>
                        <p className="font-mono">{lastScan.user_id}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-red-600 mt-1">{lastScan.message}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {lastScan.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Scan History */}
          {scanHistory.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold">Riwayat Scan ({totalScans})</h3>
                </div>
                <button
                  onClick={clearHistory}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Hapus Riwayat
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {scanHistory.map((scan) => (
                  <div
                    key={scan.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div
                      className={`p-2 rounded-full ${scan.status === "success" ? "bg-green-100" : "bg-red-100"
                        }`}
                    >
                      {scan.status === "success" ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">
                            Scan #{scan.scan_number}: {scan.nama_user}
                          </p>
                          <p className="text-xs text-gray-500">
                            {scan.nim_user} • {scan.user_id}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {scan.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="text-center mt-8 text-xs text-gray-500 flex items-center justify-center gap-1">
            <Smartphone className="w-3 h-3" />
            <span>Scan berulang untuk mengirim data secara berurutan</span>
          </div>
        </div>
      </div>
    </div>
  );
}