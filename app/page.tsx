"use client";

import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import Link from "next/link"; // Untuk navigasi kembali ke generator

export default function ScannerPage() {
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Siap. Izinkan akses kamera jika diminta.");
  const [loading, setLoading] = useState<boolean>(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // URL TERBARU GOOGLE APPS SCRIPT KAMU
  const scriptUrl = "https://script.google.com/macros/s/AKfycbwyDpKPCi8fnYe0YyCwE81tJACJHyyqy429kB8eJDhyLyNPQNTJl-LmWHs5EJbwHrMjzA/exec";

  useEffect(() => {
    const onScanSuccess = async (decodedText: string) => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
      setScannedData(decodedText);
      await sendDataToGAS(decodedText);
    };

    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
        false
      );
      scannerRef.current.render(onScanSuccess, () => {});
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, []);

  const sendDataToGAS = async (data: string) => {
    setLoading(true);
    setStatus("Mengirim data ke Spreadsheet...");

    try {
      const params = new URLSearchParams();
      params.append("barcode_data", data);

      await fetch(scriptUrl, {
        method: "POST",
        body: params,
        mode: "no-cors", 
      });

      setStatus("✅ Data berhasil tersimpan di Google Sheet!");
    } catch (error) {
      console.error("Error:", error);
      setStatus("❌ Gagal mengirim data. Cek koneksi internet.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScannedData(null);
    setStatus("Siap kembali.");
    window.location.reload(); // Reload untuk mereset kamera dengan bersih
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-900">
      <div className="max-w-2xl mx-auto">
        
        {/* Header & Navigasi */}
        <div className="flex justify-between items-center bg-gray-800 p-4 rounded-t-xl text-white">
          <h1 className="text-xl font-bold">Scanner Absensi</h1>
          <Link href="/" className="bg-white text-gray-800 px-4 py-2 rounded-md font-semibold hover:bg-gray-200 transition">
            ⬅ Kembali ke Generator
          </Link>
        </div>

        {/* Konten Scanner */}
        <div className="bg-white p-6 md:p-8 rounded-b-xl shadow-md flex flex-col items-center">
          
          {!scannedData && (
            <div className="w-full max-w-md overflow-hidden rounded-lg border-2 border-dashed border-gray-300 min-h-[300px] flex items-center justify-center bg-gray-50">
              <div id="reader" className="w-full"></div>
            </div>
          )}

          <div className="mt-4 w-full max-w-md">
            <p className={`text-sm font-medium p-3 rounded-md text-center ${
              loading ? "bg-yellow-100 text-yellow-800" :
              scannedData ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
            }`}>
              {status}
            </p>

            {scannedData && (
              <div className="mt-4 text-left">
                <p className="text-xs text-gray-500 font-semibold mb-1">Hasil Scan:</p>
                <pre className="text-xs text-gray-700 bg-gray-200 p-3 rounded-md overflow-x-auto whitespace-pre-wrap">
                  {scannedData}
                </pre>
                <button
                  onClick={handleReset}
                  className="mt-4 w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-4 rounded-md transition-colors"
                >
                  Scan Barcode Lain
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}