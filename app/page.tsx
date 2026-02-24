"use client";

import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function BarcodeScannerApp() {
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Siap. Izinkan akses kamera jika diminta.");
  const [loading, setLoading] = useState<boolean>(false);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // URL GAS TERBARU KAMU
  const scriptUrl = "https://script.google.com/macros/s/AKfycbyQf-D10MRY4d9x64l16lszuYEv9p6ggVd_vZwEfyEiqFumXILm1P0a2yMjzXXpsVxT/exec";

  useEffect(() => {
    const onScanSuccess = async (decodedText: string) => {
      if (scannerRef.current) {
        scannerRef.current.clear(); 
      }
      setScannedData(decodedText);
      await sendDataToGAS(decodedText);
    };

    const onScanFailure = () => {};

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

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error) => console.error("Gagal stop scanner", error));
        scannerRef.current = null;
      }
    };
  }, []);

  const sendDataToGAS = async (data: string) => {
    setLoading(true);
    setStatus("Mengirim data ke database...");

    try {
      // PERBAIKAN: Menggunakan URLSearchParams agar formatnya 100% cocok dengan GAS
      const params = new URLSearchParams();
      params.append("barcode_data", data);

      await fetch(scriptUrl, {
        method: "POST",
        body: params, // Kirim params, bukan formData
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