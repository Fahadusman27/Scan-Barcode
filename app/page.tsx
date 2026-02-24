"use client";

import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function BarcodeScannerApp() {
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Siap. Izinkan akses kamera jika diminta.");
  const [loading, setLoading] = useState<boolean>(false);

  // Gunakan useRef agar scanner tidak dirender ganda oleh React Strict Mode
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const scriptUrl = "https://script.google.com/macros/s/AKfycb.../exec"; // GANTI DENGAN URL GAS KAMU

  useEffect(() => {
    // Fungsi Sukses
    const onScanSuccess = async (decodedText: string) => {
      if (scannerRef.current) {
        scannerRef.current.clear(); // Hentikan kamera
      }
      setScannedData(decodedText);
      await sendDataToGAS(decodedText);
    };

    // Fungsi Gagal (abaikan agar console tidak penuh)
    const onScanFailure = () => {};

    // Cek apakah scanner sudah jalan agar tidak double-render
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
        },
        false
      );
      
      scannerRef.current.render(onScanSuccess, onScanFailure);
    }

    // Cleanup yang benar saat pindah halaman
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error) => console.error("Gagal stop scanner", error));
        scannerRef.current = null;
      }
    };
  }, []); // Kosong = hanya dijalankan sekali saat komponen dimuat

  const sendDataToGAS = async (data: string) => {
    setLoading(true);
    setStatus("Mengirim data ke database...");

    try {
      const formData = new FormData();
      formData.append("barcode_data", data);

      await fetch(scriptUrl, {
        method: "POST",
        body: formData,
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
    window.location.reload(); 
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          Web Barcode Scanner
        </h1>

        {/* Kotak ini HARUS SELALU ADA di DOM saat useEffect berjalan */}
        {!scannedData && (
          <div className="mb-4 overflow-hidden rounded-lg border-2 border-dashed border-gray-300 min-h-[300px] flex items-center justify-center bg-gray-50">
            <div id="reader" className="w-full"></div>
          </div>
        )}

        <div className="mt-4">
          <p className={`text-sm font-medium p-2 rounded-md ${
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
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
              >
                Scan Barcode Lain
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}