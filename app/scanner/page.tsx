// app/scanner/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, CheckCircle, XCircle } from 'lucide-react';
import BarcodeScanner from '@/components/BarcodeScanner';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzMyfd1oLdIvaTzgmFZffOGG5fq6MwHMTfqQF7OFoLCbER5oVkIGqUMoCy_PkPECXK2eg/exec';

interface ScanResult {
  raw: string;
  user_id?: string;
  device_id?: string;
  course_id?: string;
  session_id?: string;
  timestamp: Date;
  status: 'success' | 'error';
  message?: string;
}

export default function ScannerPage() {
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleScan = async (decodedText: string) => {
    setIsSending(true);
    
    // Parse data
    let user_id, device_id, course_id, session_id;
    let status: 'success' | 'error' = 'error';
    let message = '';

    try {
      // Coba parse JSON
      const parsed = JSON.parse(decodedText);
      user_id = parsed.user_id;
      device_id = parsed.device_id;
      course_id = parsed.course_id;
      session_id = parsed.session_id;
      
      if (user_id && device_id && course_id && session_id) {
        status = 'success';
      } else {
        message = 'Data tidak lengkap';
      }
    } catch {
      // Coba parse CSV/pipe
      const parts = decodedText.split(/[,|;:\s]+/);
      if (parts.length >= 4) {
        [user_id, device_id, course_id, session_id] = parts;
        status = 'success';
      } else {
        message = 'Format tidak dikenali';
      }
    }

    // Kirim ke Apps Script
    try {
      const formData = new URLSearchParams();
      formData.append('barcode_data', decodedText);

      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });
    } catch (error) {
      console.error('Gagal kirim ke server');
    }

    // Update state
    setLastScan({
      raw: decodedText,
      user_id,
      device_id,
      course_id,
      session_id,
      timestamp: new Date(),
      status,
      message
    });

    setIsSending(false);
    if (navigator.vibrate) navigator.vibrate(100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            📸 Scanner Barcode
          </h1>

          {/* Scanner */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <BarcodeScanner onScan={handleScan} />
            
            {isSending && (
              <div className="text-center text-blue-600 mt-4">
                Mengirim data...
              </div>
            )}
          </div>

          {/* Hasil Scan */}
          {lastScan && (
            <div className={`bg-white rounded-xl shadow-lg p-6 border-t-4 ${
              lastScan.status === 'success' ? 'border-green-500' : 'border-red-500'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                {lastScan.status === 'success' ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
                <h2 className="text-xl font-semibold">
                  {lastScan.status === 'success' ? 'Scan Berhasil' : 'Scan Gagal'}
                </h2>
              </div>

              {lastScan.status === 'success' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">User ID</p>
                    <p className="font-mono text-xl">{lastScan.user_id}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600">Device ID</p>
                    <p className="font-mono text-xl">{lastScan.device_id}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600">Course ID</p>
                    <p className="font-mono text-xl">{lastScan.course_id}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-orange-600">Session ID</p>
                    <p className="font-mono text-xl">{lastScan.session_id}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-red-600 mb-2">{lastScan.message}</p>
                  <p className="text-sm text-gray-600">Data mentah: {lastScan.raw}</p>
                </div>
              )}

              <p className="text-xs text-gray-400 mt-4">
                {lastScan.timestamp.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}