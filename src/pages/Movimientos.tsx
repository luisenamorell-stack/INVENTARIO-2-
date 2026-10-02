"use client"

import * as React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeftRight,
  Plus,
  Trash2,
  Calendar,
  Package,
  CheckCircle2,
  Loader2,
  FileText,
  UserCheck,
  ClipboardList,
  Search,
  AlertCircle,
  Image as ImageIcon
} from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/src/components/ui/card"
import { Label } from "@/src/components/ui/label"
import { Input } from "@/src/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/src/components/ui/select"
import { useToast } from "@/src/hooks/use-toast"
import { useFirestore, useCollection, useMemoFirebase } from "@/src/firebase"
import { collection, serverTimestamp, doc, increment } from "firebase/firestore"
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/src/firebase/non-blocking-updates"
import { Badge } from "@/src/components/ui/badge"
import { Separator } from "@/src/components/ui/separator"
import { ScrollArea } from "@/src/components/ui/scroll-area"

import { PageShell } from "@/src/components/layout/page-shell"
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';
import { Zap, ZapOff, Camera, ScanBarcode, XCircle } from "lucide-react"
import { cn } from "@/src/lib/utils"

const BarcodeScanner = ({ onScan }: { onScan: (code: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (successFlash) {
      const timer = setTimeout(() => successFlash && setSuccessFlash(false), 400);
      return () => clearTimeout(timer);
    }
  }, [successFlash]);

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
            setSuccessFlash(true);
            onScanRef.current(result.getText());
          }
        });

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
      }
    } catch (err: any) {
      console.error("Scanner Error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError("Acceso denegado. Permita el uso de la cámara.");
      } else {
        setPermissionError("Error de cámara. Verifique que no esté en uso.");
      }
    }
  }, []);

  useEffect(() => {
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

    startScanner();

    return () => {
      reader.reset();
    };
  }, [startScanner]);

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

  if (permissionError) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-[#091016] border border-rose-500/30 rounded-xl text-center space-y-3 aspect-[16/9] md:aspect-[21/9]">
        <XCircle className="h-10 w-10 text-rose-500" />
        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{permissionError}</p>
        <button 
          onClick={() => startScanner()}
          className="px-4 py-1.5 bg-[#2a7b9b] text-white rounded-lg text-[9px] font-bold uppercase tracking-widest"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-black rounded-xl overflow-hidden border border-[#1e3848] shadow-2xl">
      <video ref={videoRef} muted playsInline autoPlay className="w-full h-full object-cover" />
      <div className="absolute inset-0 border-[2px] border-[#38bdf8]/30 pointer-events-none" />
      <div className={cn(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 border-2 rounded-lg shadow-[0_0_20px_rgba(56,189,248,0.5)] pointer-events-none transition-all duration-300",
        successFlash ? "border-emerald-500 bg-emerald-500/20 scale-105" : "border-[#38bdf8] animate-pulse"
      )} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-[#38bdf8] shadow-[0_0_10px_#38bdf8] animate-scan-line pointer-events-none" />

      {hasTorch && (
        <button 
          onClick={toggleTorch}
          className={`absolute bottom-4 right-4 p-3 rounded-full shadow-lg transition-all ${isTorchOn ? 'bg-amber-500 text-white' : 'bg-black/50 text-gray-400 border border-white/10'}`}
        >
          {isTorchOn ? <Zap className="h-6 w-6" /> : <ZapOff className="h-6 w-6" />}
        </button>
      )}
    </div>
  );
};

export default function MovimientosPage() {
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const productsQuery = useMemoFirebase(() => firestore ? collection(firestore, "products") : null, [firestore])
  const warehousesQuery = useMemoFirebase(() => firestore ? collection(firestore, "warehouses") : null, [firestore])
  
  const { data: products } = useCollection(productsQuery)
  const { data: warehouses } = useCollection(warehousesQuery)

  const [items, setItems] = useState([{ id: Date.now(), productId: "", quantity: 1 }])
  const [movementType, setMovementType] = useState<"Entry" | "Exit" | "Transfer">("Entry")
  const [originWarehouseId, setOriginWarehouseId] = useState("")
  const [destinationWarehouseId, setDestinationWarehouseId] = useState("")
  const [authorizedBy, setAuthorizedBy] = useState("")
  const [notes, setNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [folio, setFolio] = useState<string>("")
  const [displayDate, setDisplayDate] = useState<string>("")
  const [productSearch, setProductSearch] = useState("")
  const [showScanner, setShowScanner] = useState(false)
  const lastScannedRef = useRef<{ code: string, time: number } | null>(null)

  const filteredGroupedProducts = useMemo(() => {
    if (!products) return {}
    const search = productSearch.toLowerCase().trim()
    const groups: Record<string, any[]> = {}
    
    products.forEach(p => {
      const match = !search || 
                    p.name.toLowerCase().includes(search) || 
                    (p.sku && p.sku.toLowerCase().includes(search)) ||
                    (p.barcode && p.barcode.toLowerCase().includes(search))
      if (!match) return

      const cat = p.category || "Sin Categoría"
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(p)
    })
    return groups
  }, [products, productSearch])

  useEffect(() => {
    setFolio(Date.now().toString().slice(-6))
    setDisplayDate(new Date().toLocaleDateString())
  }, [])

  const addItem = () => {
    setItems([...items, { id: Date.now(), productId: "", quantity: 1 }])
  }

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const handleUpdateItem = (id: number, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const handleScan = useCallback((code: string) => {
    if (!code || !products) return;
    const cleanCode = code.trim();

    // Throttling
    const now = Date.now();
    if (lastScannedRef.current?.code === cleanCode && (now - lastScannedRef.current.time) < 1500) return;
    lastScannedRef.current = { code: cleanCode, time: now };

    const product = products.find(p => p.sku === cleanCode || p.barcode === cleanCode);
    if (product) {
      setItems(prev => {
        // If product already in list, increment quantity
        const existingIndex = prev.findIndex(item => item.productId === product.id);
        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex].quantity = Number(updated[existingIndex].quantity) + 1;
          return updated;
        }
        
        // If first item is empty, use it
        if (prev.length === 1 && !prev[0].productId) {
          return [{ ...prev[0], productId: product.id, quantity: 1 }];
        }
        
        // Otherwise append
        return [...prev, { id: Date.now(), productId: product.id, quantity: 1 }];
      });
      toast({ title: "Producto Añadido", description: product.name, type: "success" });
    } else {
      toast({ title: "No Encontrado", description: `El código ${cleanCode} no existe.`, variant: "destructive" });
    }
  }, [products, toast]);

  const handleSubmit = async () => {
    if (!firestore) return
    if (items.some(i => !i.productId || i.quantity <= 0)) {
      toast({ title: "Error", description: "Completa todos los productos y cantidades.", variant: "destructive" })
      return
    }
    if (!originWarehouseId || !destinationWarehouseId) {
       toast({ title: "Error", description: "Selecciona origen y destino.", variant: "destructive" })
       return
    }

    setIsProcessing(true)
    try {
      for (const item of items) {
        const amount = Number(item.quantity)
        const fullNotes = `Autorizado por: ${authorizedBy}. ${notes}`.trim()
        
        const selectedProduct = products?.find(p => p.id === item.productId)
        const originWh = warehouses?.find(w => w.id === originWarehouseId)
        const destWh = warehouses?.find(w => w.id === destinationWarehouseId)

        const commonData = {
          productId: item.productId,
          productName: selectedProduct?.name || "Producto desconocido",
          quantity: amount,
          movementType: movementType,
          notes: fullNotes || "Movimiento registrado vía Ficha Digital",
          movementDate: serverTimestamp(),
          createdAt: serverTimestamp()
        }

        // Global audit log for Dashboard
        addDocumentNonBlocking(collection(firestore, "movements"), {
          ...commonData,
          type: movementType === 'Entry' ? 'entrada' : 'salida',
          warehouseName: movementType === 'Entry' ? (destWh?.name || "Destino") : (originWh?.name || "Origen"),
          timestamp: serverTimestamp()
        })

        if (originWarehouseId !== "external") {
          addDocumentNonBlocking(collection(firestore, "warehouses", originWarehouseId, "inventoryMovements"), { ...commonData, warehouseId: originWarehouseId, sourceOrDestinationWarehouseId: destinationWarehouseId })
          setDocumentNonBlocking(doc(firestore, "warehouses", originWarehouseId, "inventory", item.productId), { productId: item.productId, warehouseId: originWarehouseId, quantity: increment(-amount), lastUpdated: serverTimestamp() }, { merge: true })
        }

        if (destinationWarehouseId !== "customer") {
          addDocumentNonBlocking(collection(firestore, "warehouses", destinationWarehouseId, "inventoryMovements"), { ...commonData, warehouseId: destinationWarehouseId, sourceOrDestinationWarehouseId: originWarehouseId })
          setDocumentNonBlocking(doc(firestore, "warehouses", destinationWarehouseId, "inventory", item.productId), { productId: item.productId, warehouseId: destinationWarehouseId, quantity: increment(amount), lastUpdated: serverTimestamp() }, { merge: true })
        }
      }

      toast({ title: "Ficha Procesada", description: "Inventario actualizado correctamente.", type: "success" })
      setItems([{ id: Date.now(), productId: "", quantity: 1 }])
      setNotes("")
      setAuthorizedBy("")
      setFolio(Date.now().toString().slice(-6))
    } catch (e) {
      toast({ title: "Error", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <PageShell
      title="Ficha de Movimientos"
      description="Registro técnico de entradas, salidas y traslados"
      actions={
        <div className="px-4 py-1.5 bg-[#12222e] border border-[#1e3848] rounded-lg text-[#38bdf8] text-[11px] font-bold tracking-widest shadow-md">
          FOLIO: {folio || "..."}
        </div>
      }
    >
      {/* Columna Izquierda: Formulario Principal */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        <div className="bg-[#12222e] border border-[#1e3848] rounded-xl shadow-lg overflow-hidden">
          {/* Warehouse Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#1e3848] border-b border-[#1e3848] bg-[#0e1a24]/30">
            <div className="p-6 space-y-3">
              <label className="text-xs font-semibold text-[#00a896] uppercase tracking-wider">Punto de Origen</label>
              <Select value={originWarehouseId} onValueChange={setOriginWarehouseId}>
                <SelectTrigger className="w-full bg-[#091016] border border-[#1e3848] rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#00a896] h-11 transition-all">
                  <SelectValue placeholder="Origen de mercancía">
                    {originWarehouseId === "external" ? "PROVEEDOR EXTERNO" : (warehouses?.find(w => w.id === originWarehouseId)?.name || "Origen de mercancía")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#12222e] border-[#1e3848] text-white">
                  <SelectItem value="external" className="hover:bg-[#1e3240] focus:bg-[#1e3240] text-[#38bdf8] font-bold">PROVEEDOR EXTERNO</SelectItem>
                  {warehouses?.map(w => <SelectItem key={w.id} value={w.id} className="hover:bg-[#1e3240] focus:bg-[#1e3240]">{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="p-6 space-y-3">
              <label className="text-xs font-semibold text-[#00a896] uppercase tracking-wider">Punto de Destino</label>
              <Select value={destinationWarehouseId} onValueChange={setDestinationWarehouseId}>
                <SelectTrigger className="w-full bg-[#091016] border border-[#1e3848] rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#00a896] h-11 transition-all">
                  <SelectValue placeholder="Destino de mercancía">
                    {destinationWarehouseId === "customer" ? "CLIENTE FINAL / VENTA" : (warehouses?.find(w => w.id === destinationWarehouseId)?.name || "Destino de mercancía")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#12222e] border-[#1e3848] text-white">
                  <SelectItem value="customer" className="hover:bg-[#1e3240] focus:bg-[#1e3240] text-[#38bdf8] font-bold">CLIENTE FINAL / VENTA</SelectItem>
                  {warehouses?.map(w => <SelectItem key={w.id} value={w.id} className="hover:bg-[#1e3240] focus:bg-[#1e3240]">{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Items List */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider">
                  <Package className="h-4 w-4 text-[#38bdf8]" />
                  <span className="text-sm">Detalle de Artículos</span>
                </div>
                <button 
                  onClick={() => setShowScanner(!showScanner)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all",
                    showScanner ? "bg-amber-500 text-white border-amber-400" : "bg-[#091016] text-[#38bdf8] border-[#1e3848] hover:bg-[#1e3240]"
                  )}
                >
                  {showScanner ? <ZapOff className="h-3 w-3" /> : <ScanBarcode className="h-3 w-3" />}
                  {showScanner ? "Cerrar Escáner" : "Modo Escáner"}
                </button>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <input 
                  type="text"
                  placeholder="FILTRAR..." 
                  className="w-full bg-[#091016] border border-[#1e3848] rounded-lg pl-9 pr-4 py-2 text-[10px] text-white focus:border-[#00a896] outline-none font-bold uppercase tracking-widest"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
            </div>

            {showScanner && (
              <div className="mb-6 animate-in zoom-in-95 fade-in duration-300">
                <div className="flex items-center gap-2 mb-2">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Escaneo de Carga/Salida Activo</span>
                </div>
                <BarcodeScanner onScan={handleScan} />
                <p className="mt-2 text-center text-[9px] text-gray-500 italic">Cada escaneo suma +1 al artículo detectado</p>
              </div>
            )}

            <div className="space-y-3 sm:space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item, index) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center bg-[#091016]/40 p-3 sm:p-4 rounded-xl border border-[#1e3848] group transition-all hover:border-[#38bdf8]/30 relative">
                  <div className="hidden sm:block w-8 text-center text-[10px] font-bold text-gray-600 shrink-0">{String(index + 1).padStart(2, '0')}</div>
                  <div className="flex-1 min-w-0">
                    <Select value={item.productId} onValueChange={(v) => handleUpdateItem(item.id, "productId", v)}>
                      <SelectTrigger className="w-full bg-[#091016] border border-[#1e3848] text-white text-[11px] sm:text-xs h-10 px-3">
                        <SelectValue placeholder="Elegir producto...">
                          {products?.find(p => p.id === item.productId) ? (
                            <div className="flex items-center truncate gap-3">
                              <div className="h-6 w-6 rounded bg-[#091016] border border-[#1e3848] overflow-hidden flex items-center justify-center shrink-0">
                                {products.find(p => p.id === item.productId).imageUrl ? (
                                  <img src={products.find(p => p.id === item.productId).imageUrl} className="h-full w-full object-cover" />
                                ) : (
                                  <ImageIcon className="h-3 w-3 text-gray-700" />
                                )}
                              </div>
                              <span className="font-mono text-[#38bdf8] mr-2 shrink-0">[{products.find(p => p.id === item.productId).sku}]</span> 
                              <span className="truncate">{products.find(p => p.id === item.productId).name}</span>
                            </div>
                          ) : "Elegir producto..."}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] bg-[#12222e] border-[#1e3848] text-white">
                        <ScrollArea className="h-[250px]">
                          {Object.entries(filteredGroupedProducts as any).map(([category, prods]: [string, any]) => (
                            <SelectGroup key={category}>
                              <SelectLabel className="bg-[#0e1a24] text-[9px] font-bold uppercase text-[#00a896] tracking-widest p-2 mb-1">{category}</SelectLabel>
                              {prods.map((p: any) => (
                                <SelectItem key={p.id} value={p.id} className="hover:bg-[#1e3240] focus:bg-[#1e3240] text-xs">
                                  <div className="flex items-center gap-3">
                                    <div className="h-6 w-6 rounded bg-[#091016] border border-[#1e3848] overflow-hidden flex items-center justify-center shrink-0">
                                      {p.imageUrl ? (
                                        <img src={p.imageUrl} className="h-full w-full object-cover" />
                                      ) : (
                                        <ImageIcon className="h-3 w-3 text-gray-700" />
                                      )}
                                    </div>
                                    <span className="font-mono text-[#38bdf8] mr-2 shrink-0">[{p.sku}]</span> 
                                    <span className="truncate">{p.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="relative flex-1 sm:w-24">
                       <input 
                        type="number" 
                        value={item.quantity} 
                        onChange={e => handleUpdateItem(item.id, "quantity", e.target.value)} 
                        className="w-full bg-[#091016] border border-[#1e3848] rounded-lg px-3 py-2 text-xs sm:text-sm text-white text-center focus:border-[#00a896] outline-none font-bold h-10" 
                      />
                      <span className="absolute -top-2 left-2 bg-[#12222e] px-1 text-[7px] font-bold text-[#00a896] uppercase tracking-widest">CANT</span>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="p-2.5 text-gray-500 hover:text-rose-500 transition-colors bg-[#091016]/60 rounded-lg border border-[#1e3848] sm:border-none"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button 
                onClick={addItem} 
                className="w-full h-12 border border-dashed border-[#1e3848] rounded-lg text-gray-500 hover:text-[#38bdf8] hover:border-[#38bdf8]/50 hover:bg-[#38bdf8]/5 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" /> Añadir Renglón
              </button>
            </div>
          </div>
        </div>

        {/* Configuration Card */}
        <div className="bg-[#12222e] border border-[#1e3848] rounded-xl p-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-xs font-semibold text-[#00a896] uppercase tracking-wider">Operación</label>
              <Select value={movementType} onValueChange={(v: any) => setMovementType(v)}>
                <SelectTrigger className="w-full bg-[#091016] border border-[#1e3848] rounded-lg px-4 py-2.5 text-sm text-white h-11">
                  <SelectValue>
                    {movementType === "Entry" && "Ingreso de Carga"}
                    {movementType === "Exit" && "Salida por Venta"}
                    {movementType === "Transfer" && "Traslado Interno"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#12222e] border-[#1e3848] text-white">
                  <SelectItem value="Entry" className="text-[#00a896] font-bold">Ingreso de Carga</SelectItem>
                  <SelectItem value="Exit" className="text-rose-500 font-bold">Salida por Venta</SelectItem>
                  <SelectItem value="Transfer" className="text-[#38bdf8] font-bold">Traslado Interno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-3">
              <label className="text-xs font-semibold text-[#00a896] uppercase tracking-wider">Responsable / Autorización</label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#00a896]" />
                <input 
                  type="text"
                  placeholder="NOMBRE DEL AUTORIZADOR..." 
                  value={authorizedBy} 
                  onChange={e => setAuthorizedBy(e.target.value)} 
                  className="w-full bg-[#091016] border border-[#1e3848] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#00a896] outline-none uppercase font-semibold placeholder:text-gray-500" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Resumen y Notas */}
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <div className="bg-[#12222e] border border-[#1e3848] rounded-xl p-6 shadow-lg">
          <h3 className="text-sm font-bold text-[#38bdf8] uppercase tracking-widest mb-6">Resumen de Operación</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-[#1e3848]/50">
              <span className="text-xs text-gray-400 font-semibold uppercase">Total Artículos</span>
              <span className="text-xl font-bold text-white tracking-tighter">{items.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#1e3848]/50">
              <span className="text-xs text-gray-400 font-semibold uppercase">Total Unidades</span>
              <span className="text-xl font-bold text-[#00a896] tracking-tighter">{items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)}</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-[#091016] border border-[#1e3848] rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-[#38bdf8] shrink-0" />
            <p className="text-[10px] text-gray-400 leading-relaxed italic">
              Verifique cuidadosamente las cantidades y almacenes antes de procesar. Esta operación impactará el stock en tiempo real.
            </p>
          </div>
        </div>

        <div className="bg-[#12222e] border border-[#1e3848] rounded-xl p-6 shadow-lg">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4">Observaciones</h3>
          <textarea 
            className="w-full bg-[#091016] border border-[#1e3848] rounded-lg p-4 text-sm text-white min-h-[150px] focus:border-[#00a896] outline-none placeholder:text-gray-600 transition-all"
            placeholder="Notas adicionales sobre el traslado o pedido..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={isProcessing} 
          className="w-full bg-[#2a7b9b] hover:bg-[#236883] text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed group hidden lg:flex"
        >
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
              Procesar Movimiento
            </>
          )}
        </button>
      </div>

      {/* Sticky Mobile Confirm Button */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 p-4 bg-[#0e1a24]/90 backdrop-blur-md border-t border-[#1e3240] z-[45] flex gap-3 shadow-[0_-10px_20px_rgba(0,0,0,0.4)]">
        <div className="flex-1">
          <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Total Unidades</p>
          <p className="text-sm font-black text-[#00a896]">{items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)}</p>
        </div>
        <button 
          onClick={handleSubmit} 
          disabled={isProcessing} 
          className="flex-[2] bg-[#00a896] active:scale-95 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] disabled:opacity-50"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Procesar Ficha
            </>
          )}
        </button>
      </div>
    </PageShell>
  );
}
