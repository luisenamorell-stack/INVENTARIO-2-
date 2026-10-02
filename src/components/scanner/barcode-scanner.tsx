import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';
import { Zap, ZapOff, Camera, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  className?: string;
  active?: boolean;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, className, active = true }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const stopScanner = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    setHasTorch(false);
    setIsTorchOn(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (!active || !videoRef.current) return;
    
    setIsInitializing(true);
    setError(null);

    const hints = new Map();
    const formats = [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.ITF,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E
    ];
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.CHARACTER_SET, 'utf-8');

    const reader = new BrowserMultiFormatReader(hints);
    readerRef.current = reader;

    try {
      // First try with high-quality constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      await reader.decodeFromConstraints(constraints, videoRef.current, (result, err) => {
        if (result) {
          setSuccessFlash(true);
          onScanRef.current(result.getText());
        }
      });

      setIsInitializing(false);

      // Torch check
      setTimeout(() => {
        const stream = videoRef.current?.srcObject as MediaStream;
        const track = stream?.getVideoTracks()[0];
        if (track) {
          const capabilities = track.getCapabilities() as any;
          if (capabilities.torch) {
            setHasTorch(true);
          }
        }
      }, 1000);

    } catch (err: any) {
      console.error("Scanner Error:", err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.includes('Permission denied')) {
        setError("Acceso denegado a la cámara. Por favor, otorgue permisos en su navegador.");
      } else if (err.name === 'OverconstrainedError') {
        // Retry with basic constraints if resolution fails
        try {
          await reader.decodeFromConstraints({ video: { facingMode: "environment" } }, videoRef.current, (result) => {
            if (result) {
              setSuccessFlash(true);
              onScanRef.current(result.getText());
            }
          });
          setIsInitializing(false);
        } catch (retryErr) {
          setError("No se pudo iniciar la cámara con ninguna configuración.");
          setIsInitializing(false);
        }
      } else {
        setError(`Error al iniciar el escáner: ${err.message || "Error desconocido"}`);
      }
      setIsInitializing(false);
    }
  }, [active]);

  useEffect(() => {
    if (active) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => stopScanner();
  }, [active, startScanner, stopScanner]);

  // Flash timeout
  useEffect(() => {
    if (successFlash) {
      const timer = setTimeout(() => setSuccessFlash(false), 400);
      return () => clearTimeout(timer);
    }
  }, [successFlash]);

  const toggleTorch = async () => {
    if (!videoRef.current || !hasTorch) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream?.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !isTorchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState }]
        } as any);
        setIsTorchOn(nextState);
      } catch (e) {
        console.error("Torch Error:", e);
      }
    }
  };

  if (error) {
    return (
      <div className={cn("relative w-full aspect-[4/3] bg-[#0e1a24] rounded-2xl flex flex-col items-center justify-center p-8 text-center border-2 border-rose-500/20", className)}>
        <div className="h-16 w-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-rose-500" />
        </div>
        <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-2">Error de Cámara</h3>
        <p className="text-gray-500 text-xs leading-relaxed mb-6 max-w-[240px] mx-auto">{error}</p>
        <button 
          onClick={() => startScanner()}
          className="flex items-center gap-2 px-4 py-2 bg-[#2a7b9b] hover:bg-[#236883] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
        >
          <RefreshCw className="h-3 w-3" /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border-2 border-[#38bdf8]/30 shadow-2xl", className)}>
      <video 
        ref={videoRef} 
        muted
        playsInline
        autoPlay
        className="w-full h-full object-cover"
      />
      
      {isInitializing && (
        <div className="absolute inset-0 bg-[#0e1a24] flex flex-col items-center justify-center gap-3">
          <RefreshCw className="h-8 w-8 text-[#38bdf8] animate-spin" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Iniciando Cámara...</span>
        </div>
      )}

      {!isInitializing && (
        <>
          <div className="absolute inset-0 border-[2px] border-[#38bdf8]/20 pointer-events-none" />
          <div className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-1/3 border-2 rounded-lg shadow-[0_0_30px_rgba(56,189,248,0.4)] pointer-events-none transition-all duration-300",
            successFlash ? "border-emerald-500 bg-emerald-500/20 scale-105" : "border-[#38bdf8] animate-pulse"
          )} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-4/5 h-[1px] bg-[#38bdf8] shadow-[0_0_15px_#38bdf8] animate-scan-line pointer-events-none" />
          
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <span className="bg-black/60 px-4 py-1.5 rounded-full text-[10px] font-bold text-[#38bdf8] uppercase tracking-widest border border-[#38bdf8]/30">
              Alinee el código de barras
            </span>
          </div>

          {hasTorch && (
            <button 
              onClick={toggleTorch}
              className={`absolute bottom-4 right-4 p-3 rounded-full shadow-lg transition-all ${isTorchOn ? 'bg-amber-500 text-white' : 'bg-black/50 text-gray-400 border border-white/10'}`}
            >
              {isTorchOn ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
            </button>
          )}

          <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full border border-[#38bdf8]/30">
            <span className="text-[9px] font-bold text-[#38bdf8] uppercase tracking-widest flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
              Scanner Activo
            </span>
          </div>
        </>
      )}
    </div>
  );
};
