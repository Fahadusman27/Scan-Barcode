// app/scanner/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, LogIn, LogOut, User, CheckCircle, XCircle } from 'lucide-react';
import BarcodeScanner from '@/components/BarcodeScanner';

const APPS_SCRIPT_URL = 'httphttps://script.google.com/macros/s/AKfycbzyNnvR7s9Dr0qv9VdS6ngZysjBCZFYB72YyU7kUb3acKtXUiRd3I78qZdPUmblog3AhA/exec';

interface User {
  name: string;
  isLoggedIn: boolean;
}

interface ScanResult {
  user_id: string;
  device_id: string;
  course_id: string;
  session_id: string;
}

interface ScanHistory {
  id: string;
  scanner_name: string;
  data: ScanResult;
  timestamp: Date;
  status: 'success' | 'error';
  message?: string;
}

export default function ScannerPage() {
  // State untuk user login
  const [user, setUser] = useState<User>({ name: '', isLoggedIn: false });
  const [loginInput, setLoginInput] = useState('');
  
  // State untuk scan
  const [lastScan, setLastScan] = useState<ScanHistory | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Load history dari localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('scanHistory');
    if (savedHistory) {
      setScanHistory(JSON.parse(savedHistory).map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })));
    }
  }, []);

  // Login handler
  const handleLogin = () => {
    if (loginInput.trim()) {
      setUser({ name: loginInput.trim(), isLoggedIn: true });
      setLoginInput('');
    }
  };

  const handleLogout = () => {
    setUser({ name: '', isLoggedIn: false });
    setLastScan(null);
  };

  // Scan handler
  const handleScan = async (decodedText: string) => {
    if (!user.isLoggedIn) {
      alert('Silakan login terlebih dahulu!');
      return;
    }

    setIsSending(true);
    
    try {
      // Parse data dari QR Code
      const parsedData: ScanResult = JSON.parse(decodedText);
      
      // Validasi data
      if (!parsedData.user_id || !parsedData.device_id || !parsedData.course_id || !parsedData.session_id) {
        throw new Error('Data QR Code tidak lengkap');
      }

      // Data yang akan dikirim ke spreadsheet
      const scanData = {
        scanner_name: user.name,
        ...parsedData,
        scanned_at: new Date().toISOString()
      };

      // Kirim ke Apps Script
      const formData = new URLSearchParams();
      formData.append('barcode_data', JSON.stringify(scanData));

      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      // Catat history scan
      const newScan: ScanHistory = {
        id: Date.now().toString(),
        scanner_name: user.name,
        data: parsedData,
        timestamp: new Date(),
        status: 'success'
      };

      const updatedHistory = [newScan, ...scanHistory].slice(0, 20);
      setScanHistory(updatedHistory);
      setLastScan(newScan);
      
      // Simpan ke localStorage
      localStorage.setItem('scanHistory', JSON.stringify(updatedHistory));

      // Feedback
      if (navigator.vibrate) navigator.vibrate(100);

    } catch (error) {
      // Jika error
      const errorScan: ScanHistory = {
        id: Date.now().toString(),
        scanner_name: user.name,
        data: { user_id: '', device_id: '', course_id: '', session_id: '' },
        timestamp: new Date(),
        status: 'error',
        message: error instanceof Error ? error.message : 'Format QR Code tidak valid'
      };
      
      setLastScan(errorScan);
    } finally {
      setIsSending(false);
    }
  };

  // Clear history
  const clearHistory = () => {
    setScanHistory([]);
    localStorage.removeItem('scanHistory');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Link>
          
          {/* User Status */}
          <div className="flex items-center gap-2">
            {user.isLoggedIn ? (
              <>
                <User className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
                >
                  <LogOut className="w-3 h-3" />
                  Logout
                </button>
              </>
            ) : (
              <span className="text-sm text-gray-500">Belum login</span>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            📸 Scanner Absensi
          </h1>

          {/* Login Form (jika belum login) */}
          {!user.isLoggedIn ? (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <LogIn className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Login Scanner</h2>
              </div>
              
              <div className="max-w-md mx-auto">
                <label className="block text-sm font-medium mb-2">
                  Nama User / Scanner
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="Masukkan nama Anda"
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <button
                    onClick={handleLogin}
                    disabled={!loginInput.trim()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                  >
                    Login
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Login untuk memulai scan absensi
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Scanner Component */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Scan QR Code</h2>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>Siap scan untuk {user.name}</span>
                  </div>
                </div>

                <BarcodeScanner onScan={handleScan} />
                
                {isSending && (
                  <div className="text-center text-blue-600 mt-4">
                    Mengirim data ke spreadsheet...
                  </div>
                )}
              </div>

              {/* Hasil Scan Terakhir */}
              {lastScan && (
                <div className={`bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 ${
                  lastScan.status === 'success' ? 'border-green-500' : 'border-red-500'
                }`}>
                  <div className="flex items-center gap-2 mb-4">
                    {lastScan.status === 'success' ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                    <h2 className="text-lg font-semibold">
                      {lastScan.status === 'success' ? 'Scan Berhasil' : 'Scan Gagal'}
                    </h2>
                  </div>

                  {lastScan.status === 'success' ? (
                    <>
                      <div className="bg-blue-50 p-3 rounded-lg mb-3">
                        <span className="text-sm text-blue-600">Discan oleh:</span>
                        <span className="ml-2 font-semibold">{lastScan.scanner_name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 p-3 rounded">
                          <p className="text-xs text-blue-600">User ID</p>
                          <p className="font-mono font-bold">{lastScan.data.user_id}</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded">
                          <p className="text-xs text-purple-600">Device ID</p>
                          <p className="font-mono">{lastScan.data.device_id}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded">
                          <p className="text-xs text-green-600">Course ID</p>
                          <p className="font-mono">{lastScan.data.course_id}</p>
                        </div>
                        <div className="bg-orange-50 p-3 rounded">
                          <p className="text-xs text-orange-600">Session ID</p>
                          <p className="font-mono">{lastScan.data.session_id}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-red-50 p-4 rounded-lg text-red-600">
                      {lastScan.message}
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-4">
                    {lastScan.timestamp.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Riwayat Scan */}
              {scanHistory.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">📋 Riwayat Scan</h2>
                    <button
                      onClick={clearHistory}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Hapus Riwayat
                    </button>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {scanHistory.map((scan) => (
                      <div
                        key={scan.id}
                        className={`border rounded-lg p-3 ${
                          scan.status === 'success' 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-xs font-medium text-gray-600">
                              {scan.scanner_name}
                            </span>
                            <span className="text-xs text-gray-400 ml-2">
                              {scan.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          {scan.status === 'success' && (
                            <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded">
                              {scan.data.user_id}
                            </span>
                          )}
                        </div>

                        {scan.status === 'success' ? (
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div><span className="text-gray-500">Device:</span> {scan.data.device_id}</div>
                            <div><span className="text-gray-500">Course:</span> {scan.data.course_id}</div>
                            <div><span className="text-gray-500">Session:</span> {scan.data.session_id}</div>
                          </div>
                        ) : (
                          <div className="text-xs text-red-600">
                            {scan.message}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}