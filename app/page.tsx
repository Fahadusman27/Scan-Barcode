// app/page.tsx
import Link from 'next/link';
import { Camera } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">📱 Barcode Scanner</h1>
          <p className="text-lg text-gray-600">Aplikasi untuk scan barcode</p>
        </div>

        <div className="max-w-md mx-auto">
          <Link href="/scanner">
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition cursor-pointer">
              <div className="bg-green-100 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Camera className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-center mb-3">
                Mulai Scan
              </h2>
              <p className="text-gray-600 text-center">
                Scan barcode dan kirim data ke Google Sheets
              </p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}