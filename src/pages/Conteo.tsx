"use client"

import * as React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { 
  ScanBarcode, 
  Camera, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  Warehouse, 
  Box, 
  AlertCircle,
  History,
  Play,
  RotateCcw,
  Volume2,
  Package
} from "lucide-react"
import { PageShell } from "@/src/components/layout/page-shell"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table"
import { Badge } from "@/src/components/ui/badge"
import { useToast } from "@/src/hooks/use-toast"
import { useFirestore, useCollection, useMemoFirebase } from "@/src/firebase"
import { collection, doc, serverTimestamp, increment, setDoc } from "firebase/firestore"
import { setDocumentNonBlocking, addDocumentNonBlocking } from "@/src/firebase/non-blocking-updates"
import { Html5QrcodeScanner } from "html5-qrcode"

// Helper to play confirmation beep
let audioCtx: AudioContext | null = null;
const playBeep = (type: 'success' | 'error' = 'success') => {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(type === 'success' ? 880 : 440, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
  gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);

  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + 0.1);
};

const BarcodeScanner = ({ onScan }: { onScan: (code: string) => void }) => {
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader-conteo", { 
      fps: 10, 
      qrbox: { width: 300, height: 150 },
      aspectRatio: 1.0,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      }
    }, false);

    scanner.render((decodedText) => {
      onScanRef.current(decodedText);
    }, (error) => {
      // ignore
    });

    return () => {
      scanner.clear().catch(e => console.error("Error clearing scanner", e));
    };
  }, []); // Only run once on mount

  return <div id="reader-conteo" className="w-full bg-[#091016] rounded-xl border border-[#1e3848] overflow-hidden shadow-2xl" />;
};

interface ScannedItem {
  productId: string;
  sku: string;
  name: string;
  systemStock: number;
  countedStock: number;
  lastScanned: number;
  diferencia: number;
  estado: 'cuadrado' | 'faltante' | 'sobrante';
}

interface ResumenConteo {
  totalItems: number;
  cuadrados: number;
  faltantes: number;
  sobrantes: number;
}

export default function ConteoPage() {
  const firestore = useFirestore()
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  const productsQuery = useMemoFirebase(() => firestore ? collection(firestore, "products") : null, [firestore])
  const warehousesQuery = useMemoFirebase(() => firestore ? collection(firestore, "warehouses") : null, [firestore])
  const { data: products } = useCollection(productsQuery)
  const { data: warehouses } = useCollection(warehousesQuery)

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("")
  const [isCounting, setIsCounting] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [countingMode, setCountingMode] = useState<"unit" | "batch">("unit")
  const [batchQuantity, setBatchQuantity] = useState<string>("1")
  const [scanInput, setScanInput] = useState("")
  const [scannedItems, setScannedItems] = useState<Record<string, ScannedItem>>({})
  const [unregisteredCodes, setUnregisteredCodes] = useState<string[]>([])
  const [lastScannedProduct, setLastScannedProduct] = useState<ScannedItem | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [filtro, setFiltro] = useState<'todos' | 'faltantes' | 'discrepancias'>('todos')

  // Fetch inventory for selected warehouse
  const inventoryQuery = useMemoFirebase(() => 
    (firestore && selectedWarehouseId) ? collection(firestore, "warehouses", selectedWarehouseId, "inventory") : null, 
    [firestore, selectedWarehouseId]
  )
  const { data: inventory } = useCollection(inventoryQuery)
  
  const warehouseInventory = useMemo(() => {
    const map: Record<string, number> = {}
    inventory?.forEach(item => {
      map[item.productId] = Number(item.quantity) || 0
    })
    return map
  }, [inventory])

  const handleScan = useCallback((code: string) => {
    if (!code) return;
    const cleanCode = code.trim();
    
    // Search by Correlativo (SKU) or Barcode
    const product = products?.find(p => p.sku === cleanCode || p.barcode === cleanCode);
    
    if (product) {
      playBeep('success');
      const quantityToAdd = countingMode === "batch" ? (parseInt(batchQuantity) || 1) : 1;
      
      setScannedItems(prev => {
        const existing = prev[product.id] || {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          systemStock: warehouseInventory[product.id] || 0,
          countedStock: 0,
          lastScanned: Date.now(),
          diferencia: 0,
          estado: 'faltante'
        };
        
        const newCountedStock = existing.countedStock + quantityToAdd;
        const diferencia = newCountedStock - existing.systemStock;
        
        let estado: 'cuadrado' | 'faltante' | 'sobrante' = 'cuadrado';
        if (diferencia < 0) estado = 'faltante';
        if (diferencia > 0) estado = 'sobrante';

        const updated = {
          ...existing,
          countedStock: newCountedStock,
          lastScanned: Date.now(),
          diferencia,
          estado
        };
        
        setLastScannedProduct(updated);
        return { ...prev, [product.id]: updated };
      });

      if (countingMode === "batch") setBatchQuantity("1");
      toast({ title: "Producto Escaneado", description: `${product.name} (+${quantityToAdd})`, type: "success" });
    } else {
      playBeep('error');
      setUnregisteredCodes(prev => Array.from(new Set([...prev, cleanCode])));
      toast({ title: "Código no registrado", description: cleanCode, variant: "destructive" });
    }
    
    setScanInput("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [products, countingMode, batchQuantity, warehouseInventory, toast]);

  const handleManualScan = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(scanInput);
  };

  const startCounting = () => {
    if (!selectedWarehouseId) {
      toast({ title: "Error", description: "Seleccione una ubicación para iniciar", variant: "destructive" });
      return;
    }
    setIsCounting(true);
    setTimeout(() => inputRef.current?.focus(), 500);
  };

  const applyAdjustments = async () => {
    if (!firestore || !selectedWarehouseId || isApplying) return;
    const itemsList = Object.values(scannedItems);
    if (itemsList.length === 0) {
      toast({ title: "Sin datos", description: "No hay productos contados para aplicar.", variant: "destructive" });
      return;
    }

    if (!confirm("¿Está seguro de aplicar los ajustes? El stock del sistema será actualizado con las cantidades contadas.")) return;

    setIsApplying(true);
    try {
      for (const item of itemsList) {
        const invRef = doc(firestore, "warehouses", selectedWarehouseId, "inventory", item.productId);
        const diff = item.countedStock - item.systemStock;
        
        // Update inventory with the exact counted stock
        await setDoc(invRef, {
          productId: item.productId,
          warehouseId: selectedWarehouseId,
          quantity: item.countedStock,
          lastUpdated: serverTimestamp()
        }, { merge: true });

        if (diff !== 0) {
          // Log movement for tracking
          addDocumentNonBlocking(collection(firestore, "warehouses", selectedWarehouseId, "inventoryMovements"), {
            productId: item.productId,
            quantity: Math.abs(diff),
            movementType: diff > 0 ? "Adjustment_In" : "Adjustment_Out",
            notes: "Ajuste por Conteo Físico",
            movementDate: serverTimestamp(),
            createdAt: serverTimestamp()
          });
        }
      }

      toast({ title: "Inventario Ajustado", description: "El stock ha sido actualizado con éxito.", type: "success" });
      setIsCounting(false);
      setScannedItems({});
      setUnregisteredCodes([]);
      setLastScannedProduct(null);
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No se pudo aplicar el ajuste.", variant: "destructive" });
    } finally {
      setIsApplying(false);
    }
  };

  const resumen = useMemo((): ResumenConteo => {
    const items = Object.values(scannedItems);
    return items.reduce(
      (acc, item) => {
        acc.totalItems++;
        if (item.estado === 'cuadrado') acc.cuadrados++;
        if (item.estado === 'faltante') acc.faltantes++;
        if (item.estado === 'sobrante') acc.sobrantes++;
        return acc;
      },
      { totalItems: 0, cuadrados: 0, faltantes: 0, sobrantes: 0 }
    );
  }, [scannedItems]);

  const itemsFiltrados = useMemo(() => {
    const items = Object.values(scannedItems).sort((a, b) => b.lastScanned - a.lastScanned);
    if (filtro === 'faltantes') return items.filter(i => i.estado === 'faltante');
    if (filtro === 'discrepancias') return items.filter(i => i.estado !== 'cuadrado');
    return items;
  }, [scannedItems, filtro]);

  return (
    <PageShell
      title="Conteo de Inventario"
      description="Auditoría física y ajuste masivo de existencias"
      actions={
        isCounting && (
          <button 
            onClick={() => {
              if(window.confirm("¿Desea cancelar el conteo actual? Los datos no guardados se perderán.")) {
                setIsCounting(false);
                setScannedItems({});
                setUnregisteredCodes([]);
                setLastScannedProduct(null);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 border border-rose-500/30 text-rose-500 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
          >
            <RotateCcw className="h-4 w-4" /> Cancelar Sesión
          </button>
        )
      }
    >
      {!isCounting ? (
        <div className="col-span-12 max-w-2xl mx-auto mt-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-[#12222e] border border-[#1e3848] rounded-2xl p-10 shadow-2xl text-center space-y-8">
            <div className="h-20 w-20 rounded-full bg-[#2a7b9b]/20 flex items-center justify-center mx-auto text-[#38bdf8] border-2 border-[#38bdf8]/20 shadow-lg shadow-[#38bdf8]/10">
              <Warehouse className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Nueva Auditoría Física</h2>
              <p className="text-gray-400 text-sm">Seleccione la ubicación que desea auditar hoy</p>
            </div>

            <div className="space-y-6 text-left">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00a896] ml-1">Ubicación de Auditoría</label>
                <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                  <SelectTrigger className="w-full bg-[#091016] border border-[#1e3848] text-white h-14 rounded-xl text-lg font-bold px-6">
                    <SelectValue placeholder="SELECCIONAR BODEGA O CAMIÓN...">
                      {warehouses?.find(w => w.id === selectedWarehouseId)?.name || "SELECCIONAR BODEGA O CAMIÓN..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#12222e] border-[#1e3848] text-white">
                    {warehouses?.map(w => (
                      <SelectItem key={w.id} value={w.id} className="h-12 uppercase font-bold text-xs">
                        {w.name} {w.type === 'Camion' ? '🚚' : '🏢'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <button 
                onClick={startCounting}
                className="w-full bg-[#2a7b9b] hover:bg-[#236883] text-white font-bold py-5 rounded-xl shadow-xl shadow-[#2a7b9b]/20 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm group"
              >
                <Play className="h-5 w-5 fill-current group-hover:scale-110 transition-transform" />
                Iniciar Nuevo Conteo
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#0e1a24]/50 border border-[#1e3848]/50 p-6 rounded-xl flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white uppercase">Ajuste Directo</span>
                <span className="text-[10px] text-gray-500">Actualiza el stock al finalizar</span>
              </div>
            </div>
            <div className="bg-[#0e1a24]/50 border border-[#1e3848]/50 p-6 rounded-xl flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-[#38bdf8]/10 text-[#38bdf8] flex items-center justify-center shrink-0">
                <ScanBarcode className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white uppercase">Soporte Escáner</span>
                <span className="text-[10px] text-gray-500">Lectura continua de barras</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="col-span-12 grid grid-cols-12 gap-8">
          {/* Panel Izquierdo: Escaneo y Estado */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            {/* Tarjetas de Resumen (Semáforo) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#12222e] border border-[#1e3848] rounded-xl p-4 shadow-lg text-center">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Total Ítems</span>
                <span className="text-2xl font-black text-white">{resumen.totalItems}</span>
              </div>
              <div className="bg-[#12222e] border border-[#00a896]/30 rounded-xl p-4 shadow-lg text-center">
                <span className="text-[9px] font-bold text-[#00a896] uppercase tracking-widest block mb-1">Cuadrados 🟢</span>
                <span className="text-2xl font-black text-[#00a896]">{resumen.cuadrados}</span>
              </div>
              <div className="bg-[#12222e] border border-rose-500/30 rounded-xl p-4 shadow-lg text-center">
                <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest block mb-1">Faltantes 🔴</span>
                <span className="text-2xl font-black text-rose-500">{resumen.faltantes}</span>
              </div>
              <div className="bg-[#12222e] border border-[#38bdf8]/30 rounded-xl p-4 shadow-lg text-center">
                <span className="text-[9px] font-bold text-[#38bdf8] uppercase tracking-widest block mb-1">Sobrantes 🔵</span>
                <span className="text-2xl font-black text-[#38bdf8]">{resumen.sobrantes}</span>
              </div>
            </div>

            <div className="bg-[#12222e] border border-[#1e3848] rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-[#1e3848] pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#00a896]/20 text-[#00a896] flex items-center justify-center border border-[#00a896]/20">
                    <ScanBarcode className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Modo de Operación</span>
                    <span className="text-sm font-bold text-white uppercase mt-1">Auditando: {warehouses?.find(w => w.id === selectedWarehouseId)?.name}</span>
                  </div>
                </div>
                <div className="flex bg-[#091016] p-1 rounded-lg border border-[#1e3848]">
                  <button 
                    onClick={() => setCountingMode("unit")}
                    className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all ${countingMode === "unit" ? 'bg-[#2a7b9b] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                  >
                    Unidad (+1)
                  </button>
                  <button 
                    onClick={() => setCountingMode("batch")}
                    className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all ${countingMode === "batch" ? 'bg-[#2a7b9b] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                  >
                    Lote (xN)
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <form onSubmit={handleManualScan} className="relative">
                  <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input 
                    ref={inputRef}
                    type="text"
                    autoFocus
                    placeholder="ESPERANDO ESCANEO DE CÓDIGO..."
                    className="w-full h-16 bg-[#091016] border-2 border-[#1e3848] rounded-xl pl-12 pr-4 text-white text-lg font-mono focus:border-[#38bdf8] outline-none transition-all placeholder:text-gray-700 uppercase"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                  />
                  {countingMode === "batch" && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                       <span className="text-[10px] font-bold text-gray-500 uppercase">CANT:</span>
                       <input 
                        type="number"
                        className="w-16 h-10 bg-[#12222e] border border-[#38bdf8]/30 rounded-lg text-center text-white font-bold outline-none focus:border-[#38bdf8]"
                        value={batchQuantity}
                        onChange={(e) => setBatchQuantity(e.target.value)}
                       />
                    </div>
                  )}
                </form>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowCamera(!showCamera)}
                    className={`flex-1 h-12 rounded-xl border border-[#1e3848] transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest ${showCamera ? 'bg-amber-500 text-white border-amber-400' : 'bg-[#091016] text-[#38bdf8] hover:bg-[#1e3240]'}`}
                  >
                    <Camera className="h-5 w-5" />
                    {showCamera ? "Desactivar Cámara" : "Escaneo por Cámara"}
                  </button>
                </div>

                {showCamera && (
                  <div className="animate-in zoom-in-95 fade-in duration-300">
                    <BarcodeScanner onScan={handleScan} />
                  </div>
                )}
              </div>

              {lastScannedProduct && (
                <div className="p-6 bg-gradient-to-br from-[#00a896]/20 to-[#0e1a24] border border-[#00a896]/30 rounded-2xl animate-in fade-in slide-in-from-left-4 duration-500 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                    <Box className="h-24 w-24" />
                  </div>
                  <div className="flex flex-col gap-1 relative z-10">
                    <span className="text-[10px] font-bold text-[#00a896] uppercase tracking-[0.3em]">Último Detectado</span>
                    <h4 className="text-xl font-bold text-white uppercase tracking-tight truncate">{lastScannedProduct.name}</h4>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="bg-[#091016] px-4 py-2 rounded-lg border border-[#1e3848]">
                        <span className="text-[10px] font-bold text-gray-500 block uppercase">SKU</span>
                        <span className="text-sm font-mono text-[#38bdf8] font-bold">{lastScannedProduct.sku}</span>
                      </div>
                      <div className="bg-[#091016] px-4 py-2 rounded-lg border border-[#1e3848]">
                        <span className="text-[10px] font-bold text-gray-500 block uppercase">Total Contado</span>
                        <span className="text-sm text-white font-black">{lastScannedProduct.countedStock} <span className="text-[10px] text-gray-500 font-bold uppercase">UNID</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#12222e] border border-[#1e3848] rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#1e3848] pb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">Inconsistencias / Errores</span>
                </div>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">{unregisteredCodes.length}</Badge>
              </div>
              <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                {unregisteredCodes.length === 0 ? (
                  <p className="text-[10px] text-gray-500 italic text-center py-4">No hay códigos desconocidos detectados.</p>
                ) : unregisteredCodes.map(code => (
                  <div key={code} className="flex items-center justify-between p-3 bg-[#091016] rounded-lg border border-rose-500/20">
                    <span className="text-xs font-mono text-rose-500 font-bold">{code}</span>
                    <Badge className="bg-rose-500 text-white text-[8px] uppercase">No Registrado</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel Derecho: Tabla de Comparación */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            <div className="bg-[#12222e] border border-[#1e3848] rounded-2xl shadow-xl overflow-hidden flex flex-col h-full max-h-[700px]">
              <div className="p-6 bg-[#0e1a24]/30 border-b border-[#1e3848] flex flex-col gap-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-[#38bdf8]" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Cuadre en Tiempo Real</h3>
                  </div>
                  <button 
                    onClick={applyAdjustments}
                    disabled={isApplying || Object.keys(scannedItems).length === 0}
                    className="bg-[#00a896] hover:bg-[#008f7e] text-white px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-[#00a896]/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Aplicar Ajuste Real
                  </button>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setFiltro('todos')}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border ${filtro === 'todos' ? 'bg-white text-black border-white' : 'bg-[#091016] text-gray-500 border-[#1e3848] hover:text-white'}`}
                  >
                    Todos ({resumen.totalItems})
                  </button>
                  <button 
                    onClick={() => setFiltro('faltantes')}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border ${filtro === 'faltantes' ? 'bg-rose-600 text-white border-rose-600' : 'bg-[#091016] text-gray-500 border-[#1e3848] hover:text-rose-500'}`}
                  >
                    Solo Faltantes ({resumen.faltantes})
                  </button>
                  <button 
                    onClick={() => setFiltro('discrepancias')}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border ${filtro === 'discrepancias' ? 'bg-amber-600 text-white border-amber-600' : 'bg-[#091016] text-gray-500 border-[#1e3848] hover:text-amber-500'}`}
                  >
                    Ver Descalces ({resumen.faltantes + resumen.sobrantes})
                  </button>
                </div>
              </div>

              <div className="overflow-auto flex-1 custom-scrollbar">
                <Table>
                  <TableHeader className="bg-[#0e1a24] sticky top-0 z-10">
                    <TableRow className="border-[#1e3848] hover:bg-transparent h-14">
                      <TableHead className="text-[10px] font-bold uppercase text-gray-400 pl-6">Código</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-gray-400">Producto</TableHead>
                      <TableHead className="text-center text-[10px] font-bold uppercase text-gray-400">Sistema</TableHead>
                      <TableHead className="text-center text-[10px] font-bold uppercase text-[#38bdf8]">Contado</TableHead>
                      <TableHead className="text-center text-[10px] font-bold uppercase text-gray-400">Dif.</TableHead>
                      <TableHead className="text-right text-[10px] font-bold uppercase text-gray-400 pr-6">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-[#1e3848]/30">
                    {itemsFiltrados.map((item) => (
                      <TableRow key={item.productId} className={`hover:bg-[#1e3240]/20 border-none transition-colors ${item.lastScanned === lastScannedProduct?.lastScanned ? 'bg-[#00a896]/5' : ''}`}>
                        <TableCell className="pl-6 py-4 font-mono text-[10px] text-[#38bdf8] font-bold">
                          {item.sku}
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-xs font-bold text-white uppercase truncate max-w-[180px] block">{item.name}</span>
                        </TableCell>
                        <TableCell className="text-center font-bold text-gray-400 text-xs">{item.systemStock}</TableCell>
                        <TableCell className="text-center font-black text-[#38bdf8] text-sm">{item.countedStock}</TableCell>
                        <TableCell className="text-center">
                          <span className={`text-xs font-bold ${item.diferencia === 0 ? 'text-gray-500' : item.diferencia > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {item.diferencia > 0 ? `+${item.diferencia}` : item.diferencia}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.estado === 'cuadrado' && (
                              <span className="text-[10px] font-bold text-[#00a896] uppercase flex items-center gap-1">
                                🟢 Cuadrado
                              </span>
                            )}
                            {item.estado === 'faltante' && (
                              <span className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
                                🔴 Faltan {Math.abs(item.diferencia)}
                              </span>
                            )}
                            {item.estado === 'sobrante' && (
                              <span className="text-[10px] font-bold text-[#38bdf8] uppercase flex items-center gap-1">
                                🔵 Sobran {item.diferencia}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {itemsFiltrados.length === 0 && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={6} className="py-32 text-center">
                          <div className="flex flex-col items-center gap-3 text-gray-600">
                            <ScanBarcode className="h-12 w-12 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-[0.2em] italic">No hay ítems registrados en este filtro.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="p-4 bg-[#0e1a24]/50 border-t border-[#1e3848] text-center">
                 <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                   <Volume2 className="h-3 w-3" /> Audio de confirmación activado • Autograbado de sesión en curso
                 </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
