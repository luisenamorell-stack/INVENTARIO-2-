"use client"

import * as React from "react"
import { useState, useRef, useCallback, useMemo } from "react"
import { 
  ScanBarcode, 
  Camera, 
  Search, 
  Package, 
  Warehouse, 
  DollarSign, 
  Tag, 
  Info,
  ChevronRight,
  ArrowLeft,
  XCircle,
  RotateCcw
} from "lucide-react"
import { PageShell } from "@/src/components/layout/page-shell"
import { Card, CardContent } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { useToast } from "@/src/hooks/use-toast"
import { cn } from "@/src/lib/utils"
import { useFirestore, useCollection, useMemoFirebase } from "@/src/firebase"
import { collection, collectionGroup } from "firebase/firestore"
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';

const BarcodeScanner = ({ onScan }: { onScan: (code: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const startScanner = useCallback(async () => {
    setPermissionError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { min: 1280, ideal: 1920 },
          height: { min: 720, ideal: 1080 }
        }
      };

      if (videoRef.current && readerRef.current) {
        await readerRef.current.decodeFromConstraints(constraints, videoRef.current, (result) => {
          if (result) {
            onScanRef.current(result.getText());
          }
        });
      }
    } catch (err: any) {
      console.error("Scanner Error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError("Permiso de cámara denegado. Por favor, habilite el acceso en la configuración de su navegador.");
      } else {
        setPermissionError("No se pudo acceder a la cámara. Verifique que no esté siendo usada por otra aplicación.");
      }
    }
  }, []);

  React.useEffect(() => {
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
    
    const reader = new BrowserMultiFormatReader(hints);
    readerRef.current = reader;

    startScanner();

    return () => {
      reader.reset();
    };
  }, [startScanner]);

  if (permissionError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#091016] border-2 border-rose-500/30 rounded-2xl text-center space-y-4">
        <XCircle className="h-12 w-12 text-rose-500" />
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-white uppercase tracking-widest">Error de Acceso</h4>
          <p className="text-xs text-gray-500 max-w-[250px] mx-auto leading-relaxed">{permissionError}</p>
        </div>
        <button 
          onClick={() => startScanner()}
          className="flex items-center gap-2 px-6 py-2 bg-[#2a7b9b] hover:bg-[#236883] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reintentar Permiso
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border-2 border-[#38bdf8]/30 shadow-2xl">
      <video ref={videoRef} muted playsInline autoPlay className="w-full h-full object-cover" />
      <div className="absolute inset-0 border-[2px] border-[#38bdf8]/20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-1/3 border-2 border-[#38bdf8] rounded-lg shadow-[0_0_30px_rgba(56,189,248,0.4)] pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-4/5 h-[1px] bg-[#38bdf8] shadow-[0_0_15px_#38bdf8] animate-scan-line pointer-events-none" />
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <span className="bg-black/60 px-4 py-1.5 rounded-full text-[10px] font-bold text-[#38bdf8] uppercase tracking-widest border border-[#38bdf8]/30">
          Alinee el código de barras
        </span>
      </div>
    </div>
  );
};

export default function ConsultaPage() {
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const productsQuery = useMemoFirebase(() => firestore ? collection(firestore, "products") : null, [firestore])
  const warehousesQuery = useMemoFirebase(() => firestore ? collection(firestore, "warehouses") : null, [firestore])
  const allInventoryQuery = useMemoFirebase(() => firestore ? collectionGroup(firestore, "inventory") : null, [firestore])
  
  const { data: products } = useCollection(productsQuery)
  const { data: warehouses } = useCollection(warehousesQuery)
  const { data: allInventory } = useCollection(allInventoryQuery)

  const [searchQuery, setSearchQuery] = useState("")
  const [showScanner, setShowScanner] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)

  const handleScan = useCallback((code: string) => {
    if (!code || !products) return;
    const cleanCode = code.trim();
    
    const product = products.find(p => p.sku === cleanCode || p.barcode === cleanCode);
    if (product) {
      setSelectedProduct(product);
      setShowScanner(false);
      setSearchQuery("");
      toast({ title: "Producto Encontrado", description: product.name, type: "success" });
    } else {
      toast({ title: "No Registrado", description: `El código ${cleanCode} no existe en el catálogo.`, variant: "destructive" });
    }
  }, [products, toast]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    handleScan(searchQuery);
  };

  const productStock = useMemo(() => {
    if (!selectedProduct || !allInventory || !warehouses) return [];
    
    return warehouses.map(w => {
      const invItem = allInventory.find(i => i.productId === selectedProduct.id && i.warehouseId === w.id);
      return {
        warehouseName: w.name,
        warehouseType: w.type,
        quantity: invItem ? Number(invItem.quantity) : 0
      };
    }).sort((a, b) => b.quantity - a.quantity);
  }, [selectedProduct, allInventory, warehouses]);

  const totalStock = productStock.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <PageShell
      title="Consultor Maestro"
      description="Verificador rápido de precios y existencias"
    >
      <div className="col-span-12 max-w-2xl mx-auto w-full space-y-6">
        {!selectedProduct && showScanner && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="bg-[#12222e] border border-[#1e3848] rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-[#1e3848] pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] flex items-center justify-center border border-[#38bdf8]/20">
                    <ScanBarcode className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-bold text-white uppercase tracking-widest">Escaneo de Barra Activo</span>
                </div>
                <button 
                  onClick={() => setShowScanner(false)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <BarcodeScanner onScan={handleScan} />
            </div>
          </div>
        )}

        {(!showScanner || selectedProduct) && (
          <form onSubmit={handleManualSearch} className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-[#38bdf8] transition-colors" />
            <input 
              type="text"
              placeholder="DIGITE SKU O CÓDIGO DE BARRAS..."
              className="w-full h-16 bg-[#12222e] border-2 border-[#1e3848] rounded-2xl pl-12 pr-20 text-white text-lg font-mono focus:border-[#38bdf8] outline-none transition-all placeholder:text-gray-700 uppercase"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {!selectedProduct && !showScanner && (
                <button 
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="p-2.5 rounded-lg bg-[#091016] text-[#38bdf8] hover:bg-[#38bdf8]/10 border border-[#38bdf8]/30 transition-all"
                >
                  <Camera className="h-5 w-5" />
                </button>
              )}
              <button 
                type="submit"
                className="bg-[#38bdf8] text-black font-black px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
              >
                Buscar
              </button>
            </div>
          </form>
        )}

        {selectedProduct ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-700">
            {/* Main Info Card */}
            <div className="bg-[#12222e] border border-[#38bdf8]/30 rounded-3xl overflow-hidden shadow-2xl shadow-[#38bdf8]/5">
              <div className="bg-gradient-to-r from-[#12222e] to-[#0e1a24] p-8 border-b border-[#1e3848]">
                <div className="flex flex-col md:flex-row gap-8 items-start mb-6">
                  {selectedProduct.imageUrl && (
                    <div className="w-32 h-32 rounded-2xl border-2 border-[#38bdf8]/20 overflow-hidden shrink-0 bg-[#091016]">
                      <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className="bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/20 px-3 py-1 font-black text-[10px] tracking-[0.2em] uppercase">
                        Ficha Técnica
                      </Badge>
                      <button 
                        onClick={() => { setSelectedProduct(null); setShowScanner(true); }}
                        className="flex items-center gap-2 text-gray-500 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" /> Nueva Consulta
                      </button>
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-2">{selectedProduct.name}</h2>
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-1.5">
                         <Tag className="h-3.5 w-3.5 text-[#00a896]" />
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedProduct.category}</span>
                       </div>
                       <div className="h-1 w-1 rounded-full bg-gray-700" />
                       <div className="flex items-center gap-1.5">
                         <ScanBarcode className="h-3.5 w-3.5 text-[#38bdf8]" />
                         <span className="text-xs font-mono font-bold text-white uppercase">{selectedProduct.sku}</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 grid grid-cols-2 gap-6">
                <div className="bg-[#091016] border border-[#1e3848] rounded-2xl p-5 shadow-inner">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-[#00a896]" />
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Costo Unitario</span>
                  </div>
                  <p className="text-2xl font-black text-white tracking-tight">L. {Number(selectedProduct.costPrice || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-[#091016] border border-[#1e3848] rounded-2xl p-5 shadow-inner">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-[#38bdf8]" />
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Stock Total</span>
                  </div>
                  <p className="text-2xl font-black text-[#38bdf8] tracking-tight">{totalStock} <span className="text-[10px] text-gray-600 font-bold uppercase">Unidades</span></p>
                </div>
              </div>

              {selectedProduct.description && (
                <div className="px-8 pb-8">
                  <div className="bg-[#0e1a24] border border-[#1e3848] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4 text-gray-500" />
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Especificaciones</span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed italic">"{selectedProduct.description}"</p>
                  </div>
                </div>
              )}
            </div>

            {/* Warehouse Stock List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Warehouse className="h-4 w-4" /> Distribución por Bodega
                </h3>
              </div>
              <div className="grid gap-3">
                {productStock.map((s, idx) => (
                  <div key={idx} className={cn(
                    "flex items-center justify-between p-5 rounded-2xl border transition-all hover:scale-[1.02]",
                    s.quantity > 0 ? "bg-[#12222e] border-[#1e3848] shadow-lg" : "bg-[#091016]/50 border-[#1e3848]/50 opacity-60"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center border",
                        s.quantity > 0 ? "bg-[#091016] border-[#38bdf8]/20 text-[#38bdf8]" : "bg-[#0e1a24] border-[#1e3848] text-gray-600"
                      )}>
                        <Warehouse className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white uppercase tracking-tight">{s.warehouseName}</span>
                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{s.warehouseType}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={cn(
                        "text-xl font-black",
                        s.quantity > 0 ? "text-white" : "text-gray-600"
                      )}>{s.quantity}</span>
                      <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Existencia</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center space-y-6">
            <div className="h-24 w-24 rounded-full bg-[#12222e] border border-[#1e3848] flex items-center justify-center mx-auto text-gray-700 shadow-inner">
              <Package className="h-10 w-10 opacity-30" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em]">Esperando Datos</h3>
              <p className="text-xs text-gray-600 max-w-[200px] mx-auto italic">Escanee un producto o use el buscador para ver sus detalles técnicos.</p>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
