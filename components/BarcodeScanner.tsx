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

  const startScanner = React.useCallback(async () => {
    try {
      setStatus('Mengakses kamera...');

      const config = {
        fps: 5,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
        rememberLastUsedCamera: true,
        supportedScanTypes: []
      };

      await scannerRef.current?.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          setStatus('✅ Berhasil!');
          onScan(decodedText);
        },
        (errorMessage) => {
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
  }, [onScan]);

  useEffect(() => {
    scannerRef.current = new Html5Qrcode(scannerId);

    // Delay initialization to prevent synchronous state updates inside the effect
    const initTimer = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      clearTimeout(initTimer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [startScanner]);

  return (
    <div className="flex flex-col items-center space-y-6 w-full relative">
      <div
        style={{ width: '100%', maxWidth: width, height }}
        className="relative bg-zinc-900 rounded-2xl overflow-hidden mx-auto shadow-[0_0_40px_rgba(59,130,246,0.2)] border border-white/10 group"
      >
        <div id={scannerId} className="w-full h-full object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Overlay frame dengan animasi */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72">
            {/* Frame corners yang bersinar */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-blue-400 rounded-tl-xl shadow-[0_0_15px_rgba(96,165,250,0.5)] transition-all duration-300" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-blue-400 rounded-tr-xl shadow-[0_0_15px_rgba(96,165,250,0.5)] transition-all duration-300" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-blue-400 rounded-bl-xl shadow-[0_0_15px_rgba(96,165,250,0.5)] transition-all duration-300" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-blue-400 rounded-br-xl shadow-[0_0_15px_rgba(96,165,250,0.5)] transition-all duration-300" />

            {/* Garis scan animasi */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scan blur-[1px]" />
          </div>
        </div>
      </div>

      {/* Floating Status Scanner yang elegan */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-[280px]">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 text-white text-center text-sm px-6 py-3 rounded-full shadow-2xl font-medium tracking-wide">
          {status}
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; box-shadow: 0 0 15px rgba(96,165,250,0.8); }
          50% { transform: translateY(16rem); box-shadow: 0 0 20px rgba(96,165,250,1); }
          90% { opacity: 1; box-shadow: 0 0 15px rgba(96,165,250,0.8); }
          100% { transform: translateY(18rem); opacity: 0; }
        }
        .animate-scan {
          animation: scan 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;