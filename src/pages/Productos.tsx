"use client"

import * as React from "react"
import { useDeferredValue, useMemo, useCallback, useState, useEffect } from "react"
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2,
  Loader2,
  SortAsc,
  ArrowDownNarrowWide,
  Eye,
  ScanBarcode,
  Camera
} from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/src/components/ui/dialog"
import { Label } from "@/src/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
import { Badge } from "@/src/components/ui/badge"
import { Textarea } from "@/src/components/ui/textarea"
import { useToast } from "@/src/hooks/use-toast"
import { cn } from "@/src/lib/utils"
import { useFirestore, useCollection, useMemoFirebase } from "@/src/firebase"
import { collection, doc, serverTimestamp, collectionGroup } from "firebase/firestore"
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/src/firebase/non-blocking-updates"
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';
import { Zap, ZapOff, Wand2 } from "lucide-react"

const BarcodeScanner = ({ onScan }: { onScan: (code: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  // Flash timeout
  useEffect(() => {
    if (successFlash) {
      const timer = setTimeout(() => setSuccessFlash(false), 400);
      return () => clearTimeout(timer);
    }
  }, [successFlash]);

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

    const startScanner = async () => {
      try {
        // Use constraints directly for better compatibility
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: "environment" },
            width: { min: 1280, ideal: 1920 },
            height: { min: 720, ideal: 1080 }
          }
        };

        if (videoRef.current) {
          await reader.decodeFromConstraints(constraints, videoRef.current, (result) => {
            if (result) {
              setSuccessFlash(true);
              onScanRef.current(result.getText());
            }
          });

          // Torch check with delay to ensure stream is active
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
      } catch (err) {
        console.error("Scanner Error:", err);
      }
    };

    startScanner();

    return () => {
      reader.reset();
    };
  }, []);

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

  return (
    <div className="relative w-full aspect-[16/9] bg-black rounded-xl overflow-hidden border border-[#1e3848] shadow-2xl group">
      <video 
        ref={videoRef} 
        muted
        playsInline
        autoPlay
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 border-[2px] border-[#38bdf8]/30 pointer-events-none" />
      <div className={cn(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 border-2 rounded-lg shadow-[0_0_20px_rgba(56,189,248,0.5)] pointer-events-none transition-all duration-300",
        successFlash ? "border-emerald-500 bg-emerald-500/20 scale-105" : "border-[#38bdf8] animate-pulse"
      )} />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-[#38bdf8] shadow-[0_0_10px_#38bdf8] animate-scan-line pointer-events-none" />

      {hasTorch && (
        <button 
          onClick={toggleTorch}
          className={`absolute bottom-4 right-4 p-2.5 rounded-full shadow-lg transition-all ${isTorchOn ? 'bg-amber-500 text-white' : 'bg-black/50 text-gray-400 border border-white/10'}`}
        >
          {isTorchOn ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
        </button>
      )}

      <div className="absolute top-3 left-3 bg-black/60 px-2.5 py-0.5 rounded-full border border-[#38bdf8]/20">
        <span className="text-[8px] font-bold text-[#38bdf8] uppercase tracking-widest flex items-center gap-1.5">
          <div className="h-1 w-1 rounded-full bg-[#38bdf8] animate-pulse" />
          Scanner Active
        </span>
      </div>
    </div>
  );
};

import { Skeleton } from "@/src/components/ui/skeleton"

const ProductSkeleton = () => (
  <TableRow className="border-[#1e3848]/50 h-16">
    <TableCell className="pl-6"><Skeleton className="h-8 w-16" /></TableCell>
    <TableCell><Skeleton className="h-8 w-full max-w-[200px]" /></TableCell>
    <TableCell className="text-right"><Skeleton className="h-6 w-12 ml-auto" /></TableCell>
    <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
    <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
    <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
  </TableRow>
)

const ProductRow = React.memo(({ prod, stock, onEdit, onDelete }: { prod: any, stock: number, onEdit: (p: any) => void, onDelete: (id: string) => void }) => {
  return (
    <TableRow className="hover:bg-[#1e3240]/30 border-[#1e3848]/50 h-16 group transition-colors">
      <TableCell className="font-mono text-[11px] text-[#38bdf8] font-bold pl-6">
        <div className="flex flex-col">
          <span>{prod.sku}</span>
          {prod.barcode && <span className="text-[8px] text-gray-500 font-normal">BAR: {prod.barcode}</span>}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-bold text-xs text-white uppercase truncate">{prod.name}</span>
          <span className="text-[9px] text-[#00a896] font-bold uppercase tracking-widest mt-0.5">{prod.category}</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <span className="text-xs font-bold text-gray-200">{stock} <span className="text-gray-500 text-[10px]">UD</span></span>
      </TableCell>
      <TableCell className="text-right text-gray-500 font-bold text-[11px]">L. {Number(prod.costPrice || 0).toLocaleString('es-HN')}</TableCell>
      <TableCell className="text-right font-bold text-[#00a896] text-xs tracking-tight">L. {(stock * Number(prod.costPrice || 0)).toLocaleString('es-HN')}</TableCell>
      <TableCell className="text-right pr-6">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(prod)} className="p-1.5 rounded bg-[#091016] text-[#38bdf8] hover:bg-[#1e3240] transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
          <button onClick={() => onDelete(prod.id)} className="p-1.5 rounded bg-[#091016] text-rose-500 hover:bg-rose-500/20 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </TableCell>
    </TableRow>
  )
})
ProductRow.displayName = "ProductRow"

import { PageShell } from "@/src/components/layout/page-shell"

export default function ProductosPage() {
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const productsQuery = useMemoFirebase(() => firestore ? collection(firestore, "products") : null, [firestore])
  const warehousesQuery = useMemoFirebase(() => firestore ? collection(firestore, "warehouses") : null, [firestore])
  const allInventoryQuery = useMemoFirebase(() => firestore ? collectionGroup(firestore, "inventory") : null, [firestore])
  const { data: products, isLoading: isProductsLoading } = useCollection(productsQuery)
  const { data: warehouses } = useCollection(warehousesQuery)
  const { data: allInventory } = useCollection(allInventoryQuery)

  const activeWarehouseIds = React.useMemo(() => new Set(warehouses?.map(w => w.id) || []), [warehouses])

  const [isAdding, setIsAdding] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const [sortBy, setSortBy] = useState<string>("sku_asc")
  const [newProduct, setNewProduct] = useState({ nombre: "", sku: "", barcode: "", categoria: "", costPrice: "", descripcion: "" })
  const lastScannedRef = useRef<{ code: string, time: number } | null>(null)

  const nextSkuSuggestion = useMemo(() => {
    if (!products || products.length === 0) return "001";
    const numericSkus = products
      .map(p => parseInt(p.sku, 10))
      .filter(val => !isNaN(val));
    if (numericSkus.length === 0) return "001";
    const maxSku = Math.max(...numericSkus);
    return (maxSku + 1).toString().padStart(3, '0');
  }, [products]);

  useEffect(() => {
    if (isAdding && !editingProductId) {
      setNewProduct(prev => ({ ...prev, sku: nextSkuSuggestion }));
    }
  }, [isAdding, editingProductId, nextSkuSuggestion]);

  const stockMap = useMemo(() => {
    const map = new Map<string, number>()
    allInventory?.forEach(i => {
      if (i.productId && activeWarehouseIds.has(i.warehouseId)) {
        map.set(i.productId, (map.get(i.productId) || 0) + (Number(i.quantity) || 0))
      }
    })
    return map
  }, [allInventory, activeWarehouseIds])

  const filteredProducts = useMemo(() => {
    if (!products) return []
    const q = deferredSearchQuery.toLowerCase()
    
    const filtered = products.filter(p => {
      return `${p.name} ${p.sku} ${p.barcode || ""} ${p.category || ""}`.toLowerCase().includes(q)
    })

    return filtered.sort((a, b) => {
      const stockA = stockMap.get(a.id) || 0
      const stockB = stockMap.get(b.id) || 0

      switch (sortBy) {
        case "name_asc": return a.name.localeCompare(b.name);
        case "name_desc": return b.name.localeCompare(a.name);
        case "stock_asc": return stockA - stockB;
        case "stock_desc": return stockB - stockA;
        case "sku_asc": return (a.sku || "").localeCompare(b.sku || "", undefined, { numeric: true });
        case "sku_desc": return (b.sku || "").localeCompare(b.sku || "", undefined, { numeric: true });
        default: return 0;
      }
    })
  }, [products, deferredSearchQuery, sortBy, stockMap])

  const handleCloseDialog = useCallback(() => { 
    setIsAdding(false); 
    setEditingProductId(null); 
    setShowScanner(false);
    setNewProduct({nombre:"", sku:"", barcode: "", categoria:"", costPrice:"", descripcion:""}); 
    setIsSaving(false); 
  }, []);

  const handleSave = useCallback(() => {
    if (!firestore || isSaving) return
    if (!newProduct.nombre || !newProduct.sku || !newProduct.categoria) { 
      toast({ title: "Faltan datos", description: "Nombre, SKU y Categoría son obligatorios.", variant: "destructive" }); 
      return; 
    }
    
    // Auto-generate barcode if empty
    const finalBarcode = newProduct.barcode || `789${Date.now().toString().slice(-9)}`;
    
    setIsSaving(true);
    const data = { 
      name: newProduct.nombre, 
      sku: newProduct.sku, 
      barcode: finalBarcode,
      category: newProduct.categoria, 
      costPrice: Number(newProduct.costPrice)||0, 
      description: newProduct.descripcion, 
      updatedAt: serverTimestamp() 
    };
    if (editingProductId) {
      updateDocumentNonBlocking(doc(firestore, "products", editingProductId), data);
      toast({ title: "Producto Actualizado", type: "success" });
    } else {
      const pid = doc(collection(firestore, "products")).id;
      setDocumentNonBlocking(doc(firestore, "products", pid), { ...data, id: pid, createdAt: serverTimestamp() }, { merge: true });
      toast({ title: "Producto Creado", type: "success" });
    }
    handleCloseDialog();
  }, [firestore, isSaving, newProduct, editingProductId, toast, handleCloseDialog]);

  const actions = (
    <button 
      onClick={() => setIsAdding(true)} 
      className="bg-[#2a7b9b] hover:bg-[#236883] text-white h-11 px-6 font-bold shadow-lg shadow-[#2a7b9b]/10 uppercase tracking-widest text-[11px] rounded-lg transition-all flex items-center gap-2"
    >
      <Plus className="h-4 w-4" /> Nuevo Producto
    </button>
  )

  return (
    <PageShell
      title="Catálogo Maestro"
      description="Administración central de productos e inventarios"
      actions={actions}
    >
      {/* Columna Izquierda: Lista de Productos */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        <div className="bg-[#12222e] border border-[#1e3848] rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-[#1e3848] bg-[#0e1a24]/30 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input 
                className="w-full pl-10 pr-4 py-2.5 bg-[#091016] border border-[#1e3848] rounded-lg text-sm text-white focus:border-[#00a896] outline-none font-semibold placeholder:text-gray-500" 
                placeholder="BUSCAR POR NOMBRE O SKU..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-[#0e1a24]">
                <TableRow className="hover:bg-transparent border-[#1e3848] h-12">
                  <TableHead className="w-[100px] text-[10px] font-bold uppercase tracking-widest text-[#00a896] pl-6">SKU</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#00a896]">Producto</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Stock</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Costo</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-[#38bdf8]">Valor</TableHead>
                  <TableHead className="w-[60px] pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-[#1e3848]/50">
                {isProductsLoading ? (
                  <>
                    {[...Array(6)].map((_, i) => <ProductSkeleton key={i} />)}
                  </>
                ) : filteredProducts.length === 0 ? (
                  <TableRow className="hover:bg-transparent border-none">
                    <TableCell colSpan={6} className="text-center py-24 text-gray-500 font-bold uppercase tracking-widest text-xs italic">
                      No se encontraron artículos en el sistema.
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.map((p) => (
                  <ProductRow 
                    key={p.id} 
                    prod={p} 
                    stock={stockMap.get(p.id) || 0} 
                    onEdit={p => {
                      setNewProduct({
                        nombre:p.name, 
                        sku:p.sku, 
                        barcode: p.barcode || "",
                        categoria:p.category, 
                        costPrice:p.costPrice?.toString() || "0", 
                        descripcion:p.description || ""
                      }); 
                      setEditingProductId(p.id); 
                      setIsAdding(true);
                    }} 
                    onDelete={id => {
                      // Custom confirm logic could go here, keeping simple for now
                      if(confirm("¿Está seguro de eliminar este producto?")) {
                        deleteDocumentNonBlocking(doc(firestore, "products", id)); 
                        toast({title:"Producto Eliminado", variant: "destructive"});
                      }
                    }} 
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Controles y Resumen */}
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <div className="bg-[#12222e] border border-[#1e3848] rounded-xl p-6 shadow-lg">
          <label className="text-xs font-semibold text-[#00a896] uppercase tracking-wider mb-3 block">Ordenar Catálogo</label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full bg-[#091016] border border-[#1e3848] text-white h-12 rounded-lg font-bold">
              <SelectValue placeholder="Ordenar por...">
                {sortBy === "sku_asc" && "SKU Correlativo"}
                {sortBy === "name_asc" && "A - Z (Nombre)"}
                {sortBy === "stock_desc" && "Mayor Existencia"}
                {sortBy === "stock_asc" && "Bajo Stock"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-[#12222e] border-[#1e3848] text-white">
              <SelectItem value="sku_asc" className="text-xs font-bold uppercase">SKU Correlativo</SelectItem>
              <SelectItem value="name_asc" className="text-xs font-bold uppercase">A - Z (Nombre)</SelectItem>
              <SelectItem value="stock_desc" className="text-xs font-bold uppercase text-emerald-400">Mayor Existencia</SelectItem>
              <SelectItem value="stock_asc" className="text-xs font-bold uppercase text-rose-400">Bajo Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-gradient-to-br from-[#12222e] to-[#0e1a24] border border-[#1e3848] rounded-xl p-6 shadow-lg">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 border-b border-[#1e3848] pb-4">Resumen del Catálogo</h3>
          <div className="space-y-4">
             <div className="flex justify-between items-center py-2">
                <span className="text-xs text-gray-500 font-bold uppercase">Productos Únicos</span>
                <span className="text-lg font-bold text-white tracking-tight">{products?.length || 0}</span>
             </div>
             <div className="flex justify-between items-center py-2">
                <span className="text-xs text-gray-500 font-bold uppercase">Unidades en Red</span>
                <span className="text-lg font-bold text-[#38bdf8] tracking-tight">{Array.from(stockMap.values()).reduce((a: number, b: number) => a + b, 0)}</span>
             </div>
             <div className="flex justify-between items-center py-2 pt-4 border-t border-[#1e3848]">
                <span className="text-xs text-[#00a896] font-bold uppercase">Valorización Total</span>
                <span className="text-xl font-bold text-white tracking-tighter">
                  L. {products?.reduce((acc, p) => acc + (stockMap.get(p.id) || 0) * (Number(p.costPrice) || 0), 0).toLocaleString('es-HN')}
                </span>
             </div>
          </div>
        </div>

        <button 
          onClick={() => setIsAdding(true)}
          className="w-full bg-[#2a7b9b] hover:bg-[#236883] text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
        >
          <Plus className="h-5 w-5" />
          Registrar Nuevo Producto
        </button>
      </div>

      <Dialog open={isAdding} onOpenChange={open => !open && handleCloseDialog()}>
        <DialogContent className="max-w-2xl bg-[#12222e] border-[#1e3848] text-white shadow-2xl p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-[#38bdf8] uppercase tracking-tight">
              {editingProductId ? "Editar" : "Nuevo"} Producto
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00a896]">Código de Barras (Opcional)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input 
                      className="w-full bg-[#091016] border border-[#1e3848] rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:border-[#00a896] outline-none font-mono"
                      value={newProduct.barcode} 
                      onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} 
                      placeholder="Escanear o digitar..."
                    />
                  </div>
                  <button 
                    onClick={() => setNewProduct({...newProduct, barcode: `789${Date.now().toString().slice(-9)}`})}
                    className="p-3 rounded-lg border border-[#1e3848] bg-[#091016] text-[#00a896] hover:bg-[#1e3240] transition-all flex items-center justify-center"
                    title="Generar Automático"
                  >
                    <Wand2 className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => setShowScanner(!showScanner)}
                    className={`p-3 rounded-lg border border-[#1e3848] transition-all flex items-center justify-center ${showScanner ? 'bg-[#00a896] text-white' : 'bg-[#091016] text-[#38bdf8] hover:bg-[#1e3240]'}`}
                    title="Activar Cámara"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00a896]">SKU / Código Interno</label>
                <input 
                  className="w-full bg-[#091016] border border-[#1e3848] rounded-lg px-4 py-3 text-sm text-white focus:border-[#00a896] outline-none font-mono"
                  value={newProduct.sku} 
                  onChange={e => setNewProduct({...newProduct, sku: e.target.value})} 
                  placeholder="Ej: 001"
                />
                {!editingProductId && (
                  <p className="text-[9px] text-gray-500 font-bold uppercase">Sugerido: {nextSkuSuggestion}</p>
                )}
              </div>
            </div>

            {showScanner && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" /> Escaneo de Cámara Activo
                </label>
                <BarcodeScanner onScan={(code) => {
                  const now = Date.now();
                  if (lastScannedRef.current?.code === code && (now - lastScannedRef.current.time) < 1500) {
                    return;
                  }
                  lastScannedRef.current = { code, time: now };
                  
                  setNewProduct({...newProduct, barcode: code});
                  setShowScanner(false);
                  toast({ title: "Código Capturado", description: code, type: "success" });
                }} />
                <p className="text-[9px] text-gray-500 font-medium italic text-center">Coloque el código de barras frente a la cámara</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00a896]">Costo Unitario (L.)</label>
                <input 
                  className="w-full bg-[#091016] border border-[#1e3848] rounded-lg px-4 py-3 text-sm text-white focus:border-[#00a896] outline-none font-bold"
                  type="number" 
                  value={newProduct.costPrice} 
                  onChange={e => setNewProduct({...newProduct, costPrice: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00a896]">Categoría</label>
                <input 
                  className="w-full bg-[#091016] border border-[#1e3848] rounded-lg px-4 py-3 text-sm text-white focus:border-[#00a896] outline-none font-semibold"
                  value={newProduct.categoria} 
                  onChange={e => setNewProduct({...newProduct, categoria: e.target.value})} 
                  placeholder="Ej: Camas, Estantes..." 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00a896]">Nombre Comercial</label>
              <input 
                className="w-full bg-[#091016] border border-[#1e3848] rounded-lg px-4 py-3 text-sm text-white focus:border-[#00a896] outline-none font-bold uppercase"
                value={newProduct.nombre} 
                onChange={e => setNewProduct({...newProduct, nombre: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00a896]">Descripción Detallada</label>
              <textarea 
                className="w-full bg-[#091016] border border-[#1e3848] rounded-lg px-4 py-3 text-sm text-white focus:border-[#00a896] outline-none min-h-[100px] resize-none"
                value={newProduct.descripcion} 
                onChange={e => setNewProduct({...newProduct, descripcion: e.target.value})} 
              />
            </div>
          </div>
          <DialogFooter className="mt-10 gap-3">
            <button onClick={handleCloseDialog} className="flex-1 py-3 border border-[#1e3848] hover:bg-[#182c3c] text-gray-400 font-bold rounded-lg transition-all uppercase tracking-widest text-[10px]">
              Descartar
            </button>
            <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-3 bg-[#2a7b9b] hover:bg-[#236883] text-white font-bold rounded-lg shadow-lg transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar y Guardar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
