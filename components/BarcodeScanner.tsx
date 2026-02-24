'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (data: string) => void;
  width?: number;
  height?: number;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  width = 300,
  height = 300
}) => {
  const [status, setStatus] = useState('Menyiapkan scanner...');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = 'barcode-reader';

  useEffect(() => {
    scannerRef.current = new Html5Qrcode(scannerId);
    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = async () => {
    try {
      setStatus('Mengakses kamera...');
      
      // Konfigurasi khusus untuk data besar
      const config = {
        fps: 5,  // Turunkan FPS untuk stabilitas
        qrbox: { width: 250, height: 250 }, // Perbesar area scan
        aspectRatio: 1.0,
        disableFlip: false,
        rememberLastUsedCamera: true,
        supportedScanTypes: [] // Scan semua jenis QR
      };

      await scannerRef.current?.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          console.log('✅ QR Code terbaca! Panjang data:', decodedText.length);
          setStatus('✅ Berhasil!');
          onScan(decodedText);
        },
        (errorMessage) => {
          // Tampilkan status yang membantu user
          if (errorMessage.includes('No MultiFormat Readers')) {
            setStatus('🔍 Arahkan kamera ke QR Code...');
          } else if (errorMessage.includes('bruchteilen')) {
            setStatus('📸 Mendekatlah sedikit...');
          } else {
            setStatus('📱 Scan QR Code...');
          }
        }
      );
    } catch (err) {
      console.error('Fatal error:', err);
      setStatus('❌ Gagal akses kamera');
    }
  };

  return (
    <div className="space-y-4">
      <div 
        style={{ width, height }} 
        className="relative bg-black rounded-lg overflow-hidden mx-auto"
      >
        <div id={scannerId} className="w-full h-full" />
        
        {/* Overlay frame dengan animasi */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-72 h-72">
            {/* Frame corners */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-green-500" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-green-500" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-green-500" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-green-500" />
            
            {/* Garis scan animasi */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-500 animate-scan shadow-lg" />
          </div>
        </div>
      </div>

      {/* Status Scanner */}
      <div className="text-center text-sm bg-blue-50 p-3 rounded-lg">
        {status}
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(18rem); }
          100% { transform: translateY(0); }
        }
        .animate-scan {
          animation: scan 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;