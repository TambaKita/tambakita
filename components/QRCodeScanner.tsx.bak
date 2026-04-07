import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRCodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-scanner-container";

  useEffect(() => {
    let isActive = true;

    const initScanner = async () => {
      // Tunggu DOM siap
      await new Promise(r => setTimeout(r, 200));
      
      const container = document.getElementById(containerId);
      if (!container || !isActive) return;

      // Bersihkan container dari sisa render sebelumnya
      container.innerHTML = '';

      try {
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (isActive && scannerRef.current) {
              scanner.stop()
                .then(() => {
                  if (isActive) onScan(decodedText);
                })
                .catch(console.error);
              scannerRef.current = null;
            }
          },
          (error) => {
            // Abaikan error scan biasa
          }
        );
      } catch (err) {
        console.error("Camera error:", err);
        if (isActive) {
          alert("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
          onClose();
        }
      }
    };

    initScanner();

    return () => {
      isActive = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
      const container = document.getElementById(containerId);
      if (container) container.innerHTML = '';
    };
  }, []); // ⬅️ Kosong! Gak akan re-render ulang

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="bg-black p-4 flex justify-between items-center border-b border-white/10">
        <h3 className="text-white font-bold text-sm">Scan QR Code Kolam</h3>
        <button onClick={onClose} className="text-white/60 w-8 h-8">
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>

      <div className="flex-1 relative">
        <div id={containerId} className="w-full h-full" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-2 border-white/70 rounded-2xl" />
        </div>
        <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none z-10">
          <p className="text-white/80 text-sm font-medium">Arahkan ke QR Code</p>
          <p className="text-white/40 text-xs mt-1">Kode akan terbaca otomatis</p>
        </div>
      </div>

      <div className="bg-black p-4">
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