// components/BarcodeScanner.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (data: string) => void;
  width?: number;
  height?: number;
  fps?: number;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  width = 200,
  height = 200,
  fps = 10
}) => {
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
      await scannerRef.current?.start(
        { facingMode: 'environment' },
        {
          fps,
          qrbox: { width: 200, height: 200 },
        },
        (decodedText) => {
          // Panggil callback onScan saat barcode terdeteksi
          onScan(decodedText);
        },
        (errorMessage) => {
          // Abaikan error scanning biasa
          console.debug(errorMessage);
        }
      );
    } catch (err) {
      console.error('Gagal memulai scanner:', err);
    }
  };

  return (
    <div 
      style={{ width, height }} 
      className="relative bg-black rounded-lg overflow-hidden"
    >
      <div id={scannerId} className="w-full h-full" />
      
      {/* Overlay frame scanner */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 border-2 border-white/30 rounded-lg">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500" />
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;