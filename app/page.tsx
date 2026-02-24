// app/scanner/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, History, RefreshCw } from 'lucide-react';
import BarcodeScanner from '@/components/BarcodeGenerator';

// Ganti dengan URL Apps Script Anda
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzMyfd1oLdIvaTzgmFZffOGG5fq6MwHMTfqQF7OFoLCbER5oVkIGqUMoCy_PkPECXK2eg/exec';

interface ScanResult {
  id: string;
  data: any;
  rawData: string;
  timestamp: Date;
  status: 'success' | 'error';
}

export default function ScannerPage() {
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleScan = async (decodedText: string) => {
    setIsScanning(true);
    
    try {
      // Parse data dari barcode
      const parsedData = JSON.parse(decodedText);
      
      // Validasi data
      if (!parsedData.user_id || !parsedData.device_id || !parsedData.course_id || !parsedData.session_id) {
        throw new Error('Data tidak lengkap');
      }

      // Kirim ke Apps Script
      setIsSending(true);
      const formData = new URLSearchParams();
      formData.append('barcode_data', JSON.stringify({
        ...parsedData,
        scanned_at: new Date().toISOString()
      }));

      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      // Tambahkan ke riwayat
      const newResult: ScanResult = {
        id: Date.now().toString(),
        data: parsedData,
        rawData: decodedText,
        timestamp: new Date(),
        status: 'success'
      };

      setScanResults(prev => [newResult, ...prev].slice(0, 10));
      
      // Feedback getar
      if (navigator.vibrate) navigator.vibrate(100);

    } catch (error) {
      // Jika error, tetap tampilkan tapi dengan status error
      const errorResult: ScanResult = {
        id: Date.now().toString(),
        data: { error: error instanceof Error ? error.message : 'Format tidak valid' },
        rawData: decodedText,
        timestamp: new Date(),
        status: 'error'
      };
      
      setScanResults(prev => [errorResult, ...prev].slice(0, 10));
    } finally {
      setIsScanning(false);
      setIsSending(false);
    }
  };

  const clearHistory = () => {
    setScanResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Menu
          </Link>
          <button
            onClick={clearHistory}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Hapus Riwayat
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              📸 Scan Barcode
            </h1>
            <p className="text-gray-600">
              Arahkan kamera ke barcode untuk scan otomatis
            </p>
          </div>

          {/* Status Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-sm text-blue-700">
            <p>
              <strong>Endpoint:</strong> {APPS_SCRIPT_URL.substring(0, 50)}...
            </p>
          </div>

          {/* Scanner Component */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <BarcodeScanner 
              onScan={handleScan}
              width={640}
              height={480}
            />
            
            {/* Status Indicator */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm text-gray-600">
                  {isScanning ? 'Memproses scan...' : 'Siap scan'}
                </span>
              </div>
              {isSending && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mengirim data...</span>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-700">
                Riwayat Scan ({scanResults.length})
              </h2>
            </div>

            {scanResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Belum ada data scan</p>
                <p className="text-sm mt-1">Scan barcode untuk memulai</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {scanResults.map((result) => (
                  <div
                    key={result.id}
                    className={`border rounded-lg p-4 ${
                      result.status === 'success' 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-gray-500">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        result.status === 'success'
                          ? 'bg-green-200 text-green-700'
                          : 'bg-red-200 text-red-700'
                      }`}>
                        {result.status === 'success' ? 'Berhasil' : 'Error'}
                      </span>
                    </div>

                    {result.status === 'success' ? (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">User ID:</span>{' '}
                          <span className="font-mono">{result.data.user_id}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Device ID:</span>{' '}
                          <span className="font-mono">{result.data.device_id}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Course ID:</span>{' '}
                          <span className="font-mono">{result.data.course_id}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Session ID:</span>{' '}
                          <span className="font-mono">{result.data.session_id}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-red-600">
                        {result.data.error}
                        <div className="mt-1 text-xs text-gray-500 break-all">
                          Raw: {result.rawData}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}