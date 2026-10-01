import React, { useState } from 'react';
import { usePWAInstall } from '@/src/hooks/use-pwa-install';
import { Download, Smartphone, X, Share } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/src/components/ui/dialog';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <Button
        onClick={install}
        variant="outline"
        size="sm"
        className="bg-[#00a896]/10 text-[#00a896] border-[#00a896]/20 hover:bg-[#00a896] hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest gap-2"
      >
        <Download className="h-3.5 w-3.5" />
        Instalar App
      </Button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <Button
          onClick={() => setShowIOSGuide(true)}
          variant="outline"
          size="sm"
          className="bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/20 hover:bg-[#38bdf8] hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest gap-2"
        >
          <Smartphone className="h-3.5 w-3.5" />
          App para iPhone
        </Button>

        <Dialog open={showIOSGuide} onOpenChange={setShowIOSGuide}>
          <DialogContent className="max-w-xs bg-[#12222e] border-[#1e3240] text-white">
            <DialogHeader>
              <DialogTitle className="text-[#38bdf8] font-bold uppercase tracking-tight">Instalar en iOS</DialogTitle>
              <DialogDescription className="text-gray-400 text-xs">
                Sigue estos pasos para añadir StockFlow a tu pantalla de inicio:
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] flex items-center justify-center shrink-0 text-xs font-bold">1</div>
                <p className="text-xs text-gray-300">Toca el botón <strong>Compartir</strong> <Share className="h-3 w-3 inline mx-1 text-white" /> en la barra inferior de Safari.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] flex items-center justify-center shrink-0 text-xs font-bold">2</div>
                <p className="text-xs text-gray-300">Desliza hacia abajo y selecciona <strong>"Añadir a pantalla de inicio"</strong>.</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowIOSGuide(false)} className="w-full bg-[#2a7b9b] hover:bg-[#236883] text-white font-bold uppercase text-[10px] tracking-widest">
                Entendido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
};
