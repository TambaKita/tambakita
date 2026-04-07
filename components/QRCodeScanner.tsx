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
      await new Promise(r => setTimeout(r, 200));
      
      const container = document.getElementById(containerId);
      if (!container || !isActive) return;

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
          () => {}
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
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-[100]">
      {/* Header transparan di atas */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4 flex justify-between items-center z-20">
        <h3 className="text-white font-bold text-sm tracking-wider">SCAN QR CODE</h3>
        <button onClick={onClose} className="text-white/80 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center active:scale-95 transition-all">
          <i className="fas fa-times text-lg"></i>
        </button>
      </div>

      {/* Kamera fullscreen */}
      <div id={containerId} className="w-full h-full" />

      {/* Kotak scan di tengah */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-72 h-72 border-2 border-white rounded-2xl shadow-lg" />
      </div>

      {/* Efek corner kotak scan */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-72 h-72 relative">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl" />
        </div>
      </div>

      {/* Teks petunjuk di bawah */}
      <div className="absolute bottom-20 left-0 right-0 text-center pointer-events-none z-10">
        <p className="text-white text-sm font-medium tracking-wide">Arahkan QR Code ke dalam kotak</p>
        <p className="text-white/50 text-xs mt-2">Kode akan terbaca otomatis</p>
      </div>

      {/* Tombol batal di bawah */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <button
          onClick={onClose}
          className="w-full py-4 bg-white/20 backdrop-blur-md text-white rounded-xl font-bold text-sm active:bg-white/30 transition-all"
        >
          Batal
        </button>
      </div>
    </div>
  );
};

export default QRCodeScanner;