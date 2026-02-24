// app/scanner/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Camera, 
  LogIn, 
  LogOut, 
  User, 
  CheckCircle, 
  XCircle,
  History,
  QrCode,
  Users,
  Clock,
  Download,
  Smartphone
} from 'lucide-react';
import BarcodeScanner from '@/components/BarcodeScanner';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzMyfd1oLdIvaTzgmFZffOGG5fq6MwHMTfqQF7OFoLCbER5oVkIGqUMoCy_PkPECXK2eg/exec';

interface User {
  name: string;
  isLoggedIn: boolean;
  loginTime?: Date;
}

interface ScanResult {
  user_id: string;
  device_id: string;
  course_id: string;
  session_id: string;
  nama_user: string;
  nim_user: string;
}

interface ScanHistory {
  id: string;
  scanner_name: string;
  total_data: number;
  first_user?: string;
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
  const [scannedUsers, setScannedUsers] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

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
      setUser({ 
        name: loginInput.trim(), 
        isLoggedIn: true,
        loginTime: new Date()
      });
      setLoginInput('');
    }
  };

  const handleLogout = () => {
    setUser({ name: '', isLoggedIn: false });
    setLastScan(null);
    setScannedUsers([]);
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
      const qrData = JSON.parse(decodedText);
      
      // Validasi struktur data
      if (!qrData.users || !Array.isArray(qrData.users)) {
        throw new Error('Format data tidak valid');
      }

      setScannedUsers(qrData.users);
      setShowPreview(true);

      // Kirim data ke spreadsheet
      let successCount = 0;
      for (const userData of qrData.users) {
        const scanData = {
          scanner_name: user.name,
          user_id: userData.user_id,
          device_id: userData.device_id,
          course_id: userData.course_id,
          session_id: userData.session_id,
          nama_user: userData.nama_user,
          nim_user: userData.nim_user,
          scanned_at: new Date().toISOString()
        };

        const formData = new URLSearchParams();
        formData.append('barcode_data', JSON.stringify(scanData));

        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData
        });
        successCount++;
      }

      // Catat history scan
      const newScan: ScanHistory = {
        id: Date.now().toString(),
        scanner_name: user.name,
        total_data: qrData.users.length,
        first_user: qrData.users[0]?.nama_user,
        timestamp: new Date(),
        status: 'success'
      };

      const updatedHistory = [newScan, ...scanHistory].slice(0, 20);
      setScanHistory(updatedHistory);
      setLastScan(newScan);
      
      localStorage.setItem('scanHistory', JSON.stringify(updatedHistory));

      if (navigator.vibrate) navigator.vibrate(100);

    } catch (error) {
      const errorScan: ScanHistory = {
        id: Date.now().toString(),
        scanner_name: user.name,
        total_data: 0,
        timestamp: new Date(),
        status: 'error',
        message: error instanceof Error ? error.message : 'Format QR Code tidak valid'
      };
      
      setLastScan(errorScan);
    } finally {
      setIsSending(false);
    }
  };

  const clearHistory = () => {
    setScanHistory([]);
    localStorage.removeItem('scanHistory');
  };

  const downloadResults = () => {
    const data = {
      scanner: user.name,
      scan_time: new Date().toISOString(),
      users: scannedUsers
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-${user.name}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 transition">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Kembali</span>
            </Link>
            
            {/* User Status Badge */}
            {user.isLoggedIn && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <User className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition text-sm"
                >
                  <LogOut className="w-3 h-3" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
              <QrCode className="w-8 h-8 text-blue-600" />
              Scanner Absensi
            </h1>
            <p className="text-gray-600">Scan QR Code master untuk input data absensi</p>
          </div>

          {/* Login Section */}
          {!user.isLoggedIn ? (
            <div className="max-w-md mx-auto mb-8">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <LogIn className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Login Scanner</h2>
                    <p className="text-sm text-gray-500">Masukkan nama Anda untuk memulai</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="Contoh: Fahad, Budi, Siti"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <button
                    onClick={handleLogin}
                    disabled={!loginInput.trim()}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Mulai Scan
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Scan</p>
                      <p className="text-2xl font-bold">{scanHistory.length}</p>
                    </div>
                    <History className="w-8 h-8 text-blue-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Data Terkirim</p>
                      <p className="text-2xl font-bold">
                        {scanHistory.reduce((acc, curr) => acc + curr.total_data, 0)}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-green-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Login Sejak</p>
                      <p className="text-sm font-medium">
                        {user.loginTime?.toLocaleTimeString()}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-purple-500 opacity-50" />
                  </div>
                </div>
              </div>

              {/* Scanner Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Camera className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">Scan QR Code</h2>
                      <p className="text-sm text-gray-500">Arahkan kamera ke QR Code master</p>
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

              {/* Preview Data */}
              {showPreview && scannedUsers.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold">Preview Data ({scannedUsers.length} mahasiswa)</h3>
                    </div>
                    <button
                      onClick={downloadResults}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition"
                    >
                      <Download className="w-4 h-4" />
                      Download JSON
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto max-h-60 border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left">NIM</th>
                          <th className="px-4 py-2 text-left">Nama</th>
                          <th className="px-4 py-2 text-left">User ID</th>
                          <th className="px-4 py-2 text-left">Device</th>
                          <th className="px-4 py-2 text-left">Course</th>
                          <th className="px-4 py-2 text-left">Session</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scannedUsers.map((user, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 font-mono">{user.nim_user}</td>
                            <td className="px-4 py-2">{user.nama_user}</td>
                            <td className="px-4 py-2">{user.user_id}</td>
                            <td className="px-4 py-2">{user.device_id}</td>
                            <td className="px-4 py-2">{user.course_id}</td>
                            <td className="px-4 py-2">{user.session_id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Last Scan Result */}
              {lastScan && (
                <div className={`bg-white rounded-2xl shadow-xl p-6 mb-6 border-l-8 ${
                  lastScan.status === 'success' ? 'border-green-500' : 'border-red-500'
                }`}>
                  <div className="flex items-start gap-4">
                    {lastScan.status === 'success' ? (
                      <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {lastScan.status === 'success' ? 'Scan Berhasil' : 'Scan Gagal'}
                      </h3>
                      {lastScan.status === 'success' ? (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm">✅ {lastScan.total_data} data mahasiswa berhasil dikirim</p>
                          <p className="text-sm">👤 Scanner: {lastScan.scanner_name}</p>
                          {lastScan.first_user && (
                            <p className="text-sm">📋 Contoh: {lastScan.first_user}</p>
                          )}
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
                      <h3 className="font-semibold">Riwayat Scan</h3>
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
                        <div className={`p-2 rounded-full ${
                          scan.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {scan.status === 'success' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{scan.scanner_name}</p>
                              <p className="text-xs text-gray-500">
                                {scan.total_data} data • {scan.first_user && `contoh: ${scan.first_user}`}
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
            </>
          )}

          {/* Footer Info */}
          <div className="text-center mt-8 text-xs text-gray-500 flex items-center justify-center gap-1">
            <Smartphone className="w-3 h-3" />
            <span>Pastikan QR Code master sudah tersedia</span>
          </div>
        </div>
      </div>
    </div>
  );
}