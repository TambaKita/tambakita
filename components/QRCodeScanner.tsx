import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRCodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-reader";

  useEffect(() => {
    // Bersihkan container sebelum mulai
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = '';

    const html5QrCode = new Html5Qrcode(containerId);
    scannerRef.current = html5QrCode;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        // Berhasil scan
        html5QrCode.stop().then(() => {
          onScan(decodedText);
        }).catch((err) => console.error("Stop error:", err));
      },
      (errorMessage) => {
        // Abaikan error scan biasa (bukan error start)
      }
    ).catch((err) => {
      console.error("Start error:", err);
      alert("Gagal akses kamera. Pastikan izin diberikan.");
      onClose();
    });

    // Cleanup: stop scanner saat komponen unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch((err) => console.error("Cleanup stop error:", err));
        scannerRef.current = null;
      }
    };
  }, []); // <-- DEPENDENCY KOSONG! HANYA JALAN SEKALI SAAT MOUNT

  return (
    <div className="fixed inset-0 bg-black z-[100]">
      <div className="absolute top-0 left-0 right-0 bg-black/80 p-4 flex justify-between items-center z-10">
        <h3 className="text-white font-bold text-sm">Scan QR Code Kolam</h3>
        <button onClick={onClose} className="text-white/60 w-8 h-8">
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>

      <div id={containerId} className="w-full h-full" />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 border-2 border-white rounded-2xl" />
      </div>

      <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
        <p className="text-white text-sm font-medium">Arahkan ke QR Code</p>
        <p className="text-white/50 text-xs mt-1">Kode akan terbaca otomatis</p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4">
        <button
          onClick={onClose}
          className="w-full py-4 bg-white/10 text-white rounded-xl font-bold text-sm active:bg-white/20"
        >
          Batal
        </button>
      </div>
    </div>
  );
};

export default QRCodeScanner;