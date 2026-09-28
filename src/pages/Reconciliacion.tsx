"use client"

import * as React from "react"
import { useDeferredValue, useState, useCallback } from "react"
import { 
  Search, 
  Download,
  Calculator,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Info,
  Trash2,
  History,
  SortAsc,
  ArrowDownNarrowWide
} from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardHeader } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/src/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog"
import { Label } from "@/src/components/ui/label"
import { Badge } from "@/src/components/ui/badge"
import { useToast } from "@/src/hooks/use-toast"
import { useFirestore, useCollection, useMemoFirebase } from "@/src/firebase"
import { 
  collection, 
  serverTimestamp, 
  Timestamp, 
  query, 
  where, 
  doc, 
  increment, 
  getDocs
} from "firebase/firestore"
import { setDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/src/firebase/non-blocking-updates"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/src/components/ui/select"
import { useSearchParams } from "react-router-dom"
import { Switch } from "@/src/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert"
import { startOfWeek, addDays, subDays, format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'

const ReconciliationRow = React.memo(({ 
  id,
  name,
  sku,
  entries,
  salesByDay,
  totalExits,
  finalStock,
  totalValue,
  qtyInput, 
  isCamion,
  onUpdateInput, 
  onRegisterMovement,
  onUpdateDailySale,
  onOpenHistory,
  onDeleteProductData
}: { 
  id: string,
  name: string,
  sku: string,
  entries: number,
  salesByDay: number[],
  totalExits: number,
  finalStock: number,
  totalValue: number,
  qtyInput: string, 
  isCamion: boolean,
  onUpdateInput: (id: string, val: string) => void,
  onRegisterMovement: (id: string, name: string, type: 'Entry' | 'Exit') => void,
  onUpdateDailySale: (productId: string, productName: string, dayIndex: number, newValue: string, oldValue: number) => void,
  onOpenHistory: (id: string, name: string) => void,
  onDeleteProductData: (id: string, name: string) => void
}) => {
  return (
    <TableRow className="hover:bg-[#1e3240]/30 border-[#1e3848]/50 h-16 group transition-colors">
      <TableCell className="sticky left-0 bg-[#12222e] border-r border-[#1e3848]/50 z-10 min-w-[240px] pl-6">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1 shrink-0">
            <button className="p-1.5 rounded bg-[#091016] text-gray-500 hover:text-[#38bdf8] transition-colors" onClick={() => onOpenHistory(id, name)} title="Ver Historial"><History className="h-3 w-3" /></button>
            <button className="p-1.5 rounded bg-[#091016] text-gray-500 hover:text-rose-500 transition-colors" onClick={() => onDeleteProductData(id, name)} title="Eliminar registro">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <div className="flex flex-col truncate">
            <span className="font-bold text-xs text-white uppercase tracking-wide truncate leading-tight group-hover:text-[#38bdf8] transition-colors">{name}</span>
            <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-0.5">{sku}</span>
          </div>
        </div>
      </TableCell>
      {isCamion && (
        <TableCell className="text-center bg-[#091016]/20 font-bold text-emerald-500 text-sm border-r border-[#1e3848]/30">{entries || '-'}</TableCell>
      )}
      {isCamion ? (
        salesByDay.map((daySale, idx) => (
          <TableCell key={idx} className="p-1 border-r border-[#1e3848]/30 text-center min-w-[70px]">
            <input 
              type="number" 
              className="h-10 w-full text-center border-none bg-transparent hover:bg-[#0e1a24] focus:bg-[#091016] text-white font-bold text-sm p-0 transition-colors outline-none"
              defaultValue={daySale || ""}
              placeholder="-"
              onBlur={(e) => {
                const val = e.target.value;
                if (val !== (daySale || "").toString()) onUpdateDailySale(id, name, idx, val, daySale);
              }}
            />
          </TableCell>
        ))
      ) : null}
      <TableCell className="text-center font-bold text-white bg-[#091016]/20 border-r border-[#1e3848]/30 text-sm">{finalStock}</TableCell>
      <TableCell className="text-right font-bold border-r border-[#1e3848]/30 whitespace-nowrap text-[11px] text-gray-500 pr-4">L. {totalValue.toLocaleString('es-HN', { minimumFractionDigits: 2 })}</TableCell>
      <TableCell className="text-right sticky right-0 bg-[#12222e] border-l border-[#1e3848]/50 z-10 p-4 min-w-[180px] pr-6">
        <div className="flex items-center gap-2 justify-end">
          <input type="number" className="h-9 w-14 text-center px-1 text-xs bg-[#091016] border border-[#1e3848] rounded focus:border-[#38bdf8] font-bold text-white outline-none" value={qtyInput} onChange={e => onUpdateInput(id, e.target.value)} />
          <div className="flex flex-col gap-1">
            <button className="h-5 px-2 text-[8px] border border-emerald-500/30 text-white font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 rounded" onClick={() => onRegisterMovement(id, name, 'Entry')}>+ CARGA</button>
            <button className="h-5 px-2 text-[8px] border border-rose-500/30 text-white font-bold uppercase tracking-widest bg-rose-600 hover:bg-rose-500 rounded" onClick={() => onRegisterMovement(id, name, 'Exit')}>- VENTA</button>
          </div>
        </div>
      </TableCell>
    </TableRow>
  )
})
ReconciliationRow.displayName = "ReconciliationRow"

import { PageShell } from "@/src/components/layout/page-shell"

export default function ReconciliacionPage() {
  const firestore = useFirestore()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(searchParams.get("bodega") || "")
  const [searchQuery, setSearchQuery] = useState("")
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({})
  const [showOnlyStocked, setShowOnlyStocked] = useState(false)
  const [sortBy, setSortBy] = useState<string>("name_asc")
  const [referenceDate, setReferenceDate] = useState(new Date())
  const [historyDialog, setHistoryDialog] = useState({ isOpen: false, productId: "", productName: "" })

  const weekDays = React.useMemo(() => {
    const startOfSelectedWeek = startOfWeek(referenceDate, { weekStartsOn: 1 })
    return [0, 1, 2, 3, 4, 5].map(i => addDays(startOfSelectedWeek, i))
  }, [referenceDate])

  const productsQuery = useMemoFirebase(() => firestore ? collection(firestore, "products") : null, [firestore])
  const warehousesQuery = useMemoFirebase(() => firestore ? collection(firestore, "warehouses") : null, [firestore])
  const inventoryQuery = useMemoFirebase(() => (firestore && selectedWarehouseId) ? collection(firestore, "warehouses", selectedWarehouseId, "inventory") : null, [firestore, selectedWarehouseId])
  const movementsQuery = useMemoFirebase(() => {
    if (!firestore || !selectedWarehouseId) return null
    return query(collection(firestore, "warehouses", selectedWarehouseId, "inventoryMovements"), 
      where("movementDate", ">=", Timestamp.fromDate(weekDays[0])),
      where("movementDate", "<", Timestamp.fromDate(addDays(weekDays[5], 1))))
  }, [firestore, selectedWarehouseId, weekDays])

  const { data: products, isLoading: isProductsLoading } = useCollection(productsQuery)
  const { data: warehouses } = useCollection(warehousesQuery)
  const { data: movements, isLoading: isMovementsLoading } = useCollection(movementsQuery)
  const { data: inventory } = useCollection(inventoryQuery)

  const selectedWh = React.useMemo(() => warehouses?.find(w => w.id === selectedWarehouseId), [warehouses, selectedWarehouseId])
  const isCamion = React.useMemo(() => selectedWh?.type === 'Camion' || selectedWh?.name?.toUpperCase().includes('CAMION'), [selectedWh])

  const inventoryStats = React.useMemo(() => {
    if (!products) return []
    const invMap = new Map<string, number>()
    inventory?.forEach(item => invMap.set(item.productId, Number(item.quantity) || 0))
    const movementsByProduct = new Map<string, any[]>()
    movements?.forEach(m => {
      const existing = movementsByProduct.get(m.productId) || []
      existing.push(m)
      movementsByProduct.set(m.productId, existing)
    })

    const keywords = deferredSearchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean)
    
    const filtered = products.filter(p => {
      const text = `${p.name} ${p.sku} ${p.barcode || ""} ${p.category || ""}`.toLowerCase()
      const matchKeywords = keywords.every(kw => text.includes(kw))
      if (!matchKeywords) return false
      if (showOnlyStocked) return (invMap.get(p.id) || 0) > 0 || movementsByProduct.has(p.id)
      return true
    }).map(p => {
      const pMovs = movementsByProduct.get(p.id) || []
      let entries = 0, exits = 0; const sales = [0,0,0,0,0,0]
      pMovs.forEach(m => {
        const q = Number(m.quantity) || 0
        if (m.movementType === 'Entry' || m.movementType === 'Transfer_In') entries += q
        else if (m.movementType === 'Exit' || m.movementType === 'Transfer_Out') {
          exits += q
          if (m.movementDate) {
            const mD = (m.movementDate as Timestamp).toDate()
            for(let i=0; i<6; i++) if(isSameDay(mD, weekDays[i])) { sales[i] += q; break; }
          }
        }
      })
      const stock = invMap.get(p.id) || 0
      return { id: p.id, name: p.name, sku: p.sku, entries, salesByDay: sales, totalExits: exits, finalStock: stock, totalValue: stock * (Number(p.costPrice) || 0) }
    })

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name_asc": return a.name.localeCompare(b.name);
        case "name_desc": return b.name.localeCompare(a.name);
        case "stock_asc": return a.finalStock - b.finalStock;
        case "stock_desc": return b.finalStock - a.finalStock;
        case "value_desc": return b.totalValue - a.totalValue;
        default: return 0;
      }
    })
  }, [products, inventory, movements, deferredSearchQuery, showOnlyStocked, weekDays, sortBy])

  const handleRegisterMovement = useCallback((productId: string, productName: string, type: 'Entry' | 'Exit') => {
    const qtyInput = qtyInputs[productId] || "1";
    const qty = parseInt(qtyInput);
    if (isNaN(qty) || qty <= 0 || !firestore || !selectedWarehouseId) return
    
    addDocumentNonBlocking(collection(firestore, "warehouses", selectedWarehouseId, "inventoryMovements"), { 
      productId, 
      warehouseId: selectedWarehouseId, 
      quantity: qty, 
      movementType: type, 
      movementDate: serverTimestamp(), 
      notes: `Registro manual desde planilla`, 
      createdAt: serverTimestamp() 
    })

    // Global audit log for Dashboard
    addDocumentNonBlocking(collection(firestore, "movements"), {
      productId,
      productName: productName,
      warehouseId: selectedWarehouseId,
      warehouseName: selectedWh?.name || "Unidad",
      quantity: qty,
      movementType: type,
      type: type === 'Entry' ? 'entrada' : 'salida',
      movementDate: serverTimestamp(),
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp()
    })
    
    setDocumentNonBlocking(doc(firestore, "warehouses", selectedWarehouseId, "inventory", productId), { 
      productId, 
      warehouseId: selectedWarehouseId, 
      quantity: increment(type === 'Entry' ? qty : -qty), 
      lastUpdated: serverTimestamp() 
    }, { merge: true })
    
    setQtyInputs(prev => ({ ...prev, [productId]: "" })); 
    toast({ title: "Movimiento Registrado", description: `${productName}: ${type === 'Entry' ? '+' : '-'}${qty}`, type: "success" })
  }, [firestore, selectedWarehouseId, qtyInputs, toast, selectedWh])

  const handleUpdateDailySale = useCallback((productId: string, productName: string, dayIndex: number, newValueStr: string, oldValue: number) => {
    const newValue = parseInt(newValueStr) || 0, diff = newValue - oldValue
    if (diff === 0 || !firestore || !selectedWarehouseId) return
    
    addDocumentNonBlocking(collection(firestore, "warehouses", selectedWarehouseId, "inventoryMovements"), { 
      productId, 
      warehouseId: selectedWarehouseId, 
      quantity: Math.abs(diff), 
      movementType: diff > 0 ? 'Exit' : 'Entry', 
      movementDate: Timestamp.fromDate(weekDays[dayIndex]), 
      notes: `Actualización en planilla diaria`, 
      createdAt: serverTimestamp() 
    })

    // Global audit log for Dashboard
    const type = diff > 0 ? 'Exit' : 'Entry';
    addDocumentNonBlocking(collection(firestore, "movements"), {
      productId,
      productName: productName,
      warehouseId: selectedWarehouseId,
      warehouseName: selectedWh?.name || "Unidad",
      quantity: Math.abs(diff),
      movementType: type,
      type: type === 'Entry' ? 'entrada' : 'salida',
      movementDate: Timestamp.fromDate(weekDays[dayIndex]),
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp()
    })
    
    setDocumentNonBlocking(doc(firestore, "warehouses", selectedWarehouseId, "inventory", productId), { 
      quantity: increment(-diff), 
      lastUpdated: serverTimestamp() 
    }, { merge: true })
    
    toast({ title: "Planilla Actualizada", description: productName, type: "success" })
  }, [firestore, selectedWarehouseId, weekDays, toast, selectedWh])

  const handleDeleteMovement = useCallback((m: any) => {
    if (!firestore || !selectedWarehouseId) return
    const isEntry = m.movementType === 'Entry' || m.movementType === 'Transfer_In'
    deleteDocumentNonBlocking(doc(firestore, "warehouses", selectedWarehouseId, "inventoryMovements", m.id))
    setDocumentNonBlocking(doc(firestore, "warehouses", selectedWarehouseId, "inventory", m.productId), { 
      quantity: increment(isEntry ? -m.quantity : m.quantity), 
      lastUpdated: serverTimestamp() 
    }, { merge: true })
    toast({ title: "Registro Anulado", variant: "destructive" })
  }, [firestore, selectedWarehouseId, toast])

  const handleDeleteProductData = useCallback(async (pid: string, pname: string) => {
    if (!firestore || !selectedWarehouseId) return;
    if (!window.confirm(`¿Quitar "${pname}" de esta bodega? Se borrará el stock actual y todos los movimientos registrados.`)) return;
    
    deleteDocumentNonBlocking(doc(firestore, "warehouses", selectedWarehouseId, "inventory", pid));
    const q = query(collection(firestore, "warehouses", selectedWarehouseId, "inventoryMovements"), where("productId", "==", pid));
    const snap = await getDocs(q); 
    snap.forEach(d => deleteDocumentNonBlocking(d.ref));
    
    toast({ title: "Artículo Limpiado", description: "Se han removido todos los datos del producto en esta unidad." })
  }, [firestore, selectedWarehouseId, toast])

  const handleResetInventory = useCallback(async () => {
    if (!firestore || !selectedWarehouseId || !window.confirm("¿ESTÁS SEGURO DE BORRAR TODO EL INVENTARIO Y MOVIMIENTOS DE ESTA BODEGA/CAMIÓN? Esta acción es definitiva.")) return;
    
    const invSnap = await getDocs(collection(firestore, "warehouses", selectedWarehouseId, "inventory")); 
    invSnap.forEach(d => deleteDocumentNonBlocking(d.ref));
    
    const movSnap = await getDocs(collection(firestore, "warehouses", selectedWarehouseId, "inventoryMovements")); 
    movSnap.forEach(d => deleteDocumentNonBlocking(d.ref));
    
    toast({ title: "Unidad Reiniciada", description: "Se han borrado todos los registros de esta unidad.", variant: "destructive" })
  }, [firestore, selectedWarehouseId, toast])

  const actions = (
    <button 
      onClick={() => window.print()} 
      className="border border-[#1e3848] hover:bg-[#182c3c] text-[#38bdf8] py-2.5 px-6 rounded-lg transition-all font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-md"
    >
      <Download className="h-4 w-4" /> Imprimir Planilla
    </button>
  )

  return (
    <PageShell
      title="Planilla de Cuadre"
      description="Control semanal de inventario y registro de ventas diarias"
      actions={actions}
    >
      {/* Columna Izquierda: Tabla de Productos */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        <div className="bg-[#12222e] border border-[#1e3848] rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-[#1e3848] bg-[#0e1a24]/30 flex items-center justify-between">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input 
                className="w-full pl-10 pr-4 py-2 bg-[#091016] border border-[#1e3848] rounded-lg text-sm text-white focus:border-[#00a896] outline-none font-semibold placeholder:text-gray-500" 
                placeholder="BUSCAR ARTÍCULO O SKU..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-[#0e1a24]">
                <TableRow className="hover:bg-transparent border-[#1e3848] h-12">
                  <TableHead className="w-[240px] sticky left-0 bg-[#0e1a24] border-r border-[#1e3848] text-[10px] font-bold uppercase tracking-widest text-[#00a896] pl-6 z-20">Producto</TableHead>
                  {isCamion && (
                    <TableHead className="text-center text-[10px] font-bold uppercase tracking-widest text-emerald-500 border-r border-[#1e3848]">Carga</TableHead>
                  )}
                  {isCamion ? weekDays.map((d,idx) => (
                    <TableHead key={idx} className="text-center border-r border-[#1e3848] text-[10px] font-bold uppercase tracking-widest min-w-[70px] text-gray-400">{format(d, 'eee', {locale:es})}</TableHead>
                  )) : null}
                  <TableHead className="text-center text-[10px] font-bold uppercase tracking-widest text-[#38bdf8] border-r border-[#1e3848]">Stock</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-gray-400 pr-6">Valor</TableHead>
                  <TableHead className="text-right sticky right-0 bg-[#0e1a24] border-l border-[#1e3848] text-[10px] font-bold uppercase tracking-widest text-gray-400 pr-6 z-20">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-[#1e3848]/50">
                {isProductsLoading || isMovementsLoading ? (
                  <TableRow className="hover:bg-transparent border-none">
                    <TableCell colSpan={12} className="text-center py-24">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#00a896]" />
                      <p className="mt-4 text-[10px] font-bold uppercase text-gray-500 tracking-widest">Sincronizando registros...</p>
                    </TableCell>
                  </TableRow>
                ) : inventoryStats.length === 0 ? (
                  <TableRow className="hover:bg-transparent border-none">
                    <TableCell colSpan={12} className="text-center py-24 text-gray-500 font-bold uppercase tracking-widest text-xs italic">
                      No se encontraron artículos en esta unidad.
                    </TableCell>
                  </TableRow>
                ) : inventoryStats.map((item) => (
                  <ReconciliationRow 
                    key={item.id} 
                    {...item} 
                    qtyInput={qtyInputs[item.id] || ""} 
                    isCamion={isCamion} 
                    onUpdateInput={(id,v) => setQtyInputs(p=>({...p,[id]:v}))} 
                    onRegisterMovement={handleRegisterMovement} 
                    onUpdateDailySale={handleUpdateDailySale} 
                    onOpenHistory={(pid,pn) => setHistoryDialog({isOpen:true, productId:pid, productName:pn})} 
                    onDeleteProductData={handleDeleteProductData} 
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Controles y Resumen */}
      <div className="col-span-12 lg:col-span-4 space-y-6">
        {/* Selector de Bodega */}
        <div className="bg-[#12222e] border border-[#1e3848] rounded-xl p-6 shadow-lg">
          <label className="text-xs font-semibold text-[#00a896] uppercase tracking-wider mb-3 block">Unidad Seleccionada</label>
          <div className="flex gap-2">
            <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
              <SelectTrigger className="flex-1 bg-[#091016] border border-[#1e3848] text-white h-12 rounded-lg font-bold">
                <SelectValue placeholder="Elegir bodega...">
                  {warehouses?.find(w => w.id === selectedWarehouseId)?.name || "Elegir bodega..."}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#12222e] border-[#1e3848] text-white">
                {warehouses?.map(w => (
                  <SelectItem key={w.id} value={w.id} className="hover:bg-[#1e3240] focus:bg-[#1e3240] uppercase text-xs font-bold">
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button 
              onClick={handleResetInventory}
              className="w-12 h-12 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shrink-0 shadow-md"
              title="Reiniciar Unidad"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-[#091016] border border-[#1e3848] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-[#38bdf8]" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Modo Operativo</span>
            </div>
            <p className="text-[11px] font-bold text-[#00a896] uppercase">
              {isCamion ? "Ruta / Camión de Ventas" : "Almacén Central / Bodega"}
            </p>
          </div>
        </div>

        {/* Filtros y Orden */}
        <div className="bg-[#12222e] border border-[#1e3848] rounded-xl p-6 shadow-lg space-y-6">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Criterio de Orden</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full bg-[#091016] border border-[#1e3848] text-white h-11 rounded-lg">
                <SelectValue>
                  {sortBy === "name_asc" && "A - Z (Nombre)"}
                  {sortBy === "name_desc" && "Z - A (Nombre)"}
                  {sortBy === "stock_asc" && "Bajo Stock"}
                  {sortBy === "stock_desc" && "Mayor Stock"}
                  {sortBy === "value_desc" && "Mayor Valoración"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#12222e] border-[#1e3848] text-white">
                <SelectItem value="name_asc" className="text-xs font-bold uppercase">A - Z (Nombre)</SelectItem>
                <SelectItem value="name_desc" className="text-xs font-bold uppercase">Z - A (Nombre)</SelectItem>
                <SelectItem value="stock_asc" className="text-xs font-bold uppercase text-rose-400">Bajo Stock</SelectItem>
                <SelectItem value="stock_desc" className="text-xs font-bold uppercase text-emerald-400">Mayor Stock</SelectItem>
                <SelectItem value="value_desc" className="text-xs font-bold uppercase text-[#38bdf8]">Mayor Valoración</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div 
            className="flex items-center justify-between p-4 bg-[#091016] border border-[#1e3848] rounded-lg cursor-pointer group"
            onClick={() => setShowOnlyStocked(!showOnlyStocked)}
          >
            <span className="text-xs font-bold text-gray-400 uppercase group-hover:text-white transition-colors">Ver solo con Stock</span>
            <Switch 
              checked={showOnlyStocked} 
              onCheckedChange={setShowOnlyStocked} 
              className="data-[state=checked]:bg-[#00a896]" 
            />
          </div>
        </div>

        {/* Valuación y Semana */}
        <div className="bg-gradient-to-br from-[#12222e] to-[#0e1a24] border border-[#1e3848] rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setReferenceDate(subDays(referenceDate, 7))} className="p-2 rounded-lg hover:bg-[#1e3240] text-[#38bdf8] transition-all border border-[#1e3848]">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-center">
               <p className="text-[10px] font-bold text-[#00a896] uppercase tracking-[0.2em] mb-1">Semana del Cuadre</p>
               <p className="text-xs font-bold text-white uppercase">{format(weekDays[0], 'dd MMM')} — {format(weekDays[5], 'dd MMM')}</p>
            </div>
            <button onClick={() => setReferenceDate(addDays(referenceDate, 7))} className="p-2 rounded-lg hover:bg-[#1e3240] text-[#38bdf8] transition-all border border-[#1e3848]">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="pt-6 border-t border-[#1e3848]/50">
             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Valoración Total Unidad</p>
             <h3 className="text-2xl font-bold text-white tracking-tighter">
               L. {inventoryStats.reduce((s,i) => s+i.totalValue, 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
             </h3>
          </div>
        </div>
      </div>

      <Dialog open={historyDialog.isOpen} onOpenChange={open => setHistoryDialog(p=>({...p, isOpen:open}))}>
        <DialogContent className="max-w-2xl bg-[#12222e] border-[#1e3848] text-white shadow-2xl p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold text-[#38bdf8] uppercase tracking-tight flex items-center gap-3">
              <History className="h-6 w-6" /> {historyDialog.productName}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-[#0e1a24]">
                <TableRow className="hover:bg-transparent border-[#1e3848]">
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#00a896]">Fecha / Hora</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#00a896]">Tipo Mov.</TableHead>
                  <TableHead className="text-center text-[10px] font-bold uppercase tracking-widest text-[#00a896]">Cant.</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-[#1e3848]/50">
                {movements?.filter(m => m.productId === historyDialog.productId).sort((a,b) => (b.movementDate?.seconds || 0) - (a.movementDate?.seconds || 0)).map(m => (
                  <TableRow key={m.id} className="hover:bg-[#1e3240]/30 border-none group transition-colors">
                    <TableCell className="text-[11px] font-bold text-gray-400 uppercase">
                      {m.movementDate ? format(m.movementDate.toDate(), 'dd/MM/yy HH:mm') : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[9px] font-bold uppercase tracking-widest border-none text-white ${
                        m.movementType === 'Entry' || m.movementType === 'Transfer_In' 
                        ? 'bg-[#00a896]/20 text-[#00a896]' 
                        : 'bg-rose-500/20 text-rose-500'
                      }`}>
                        {m.movementType === 'Entry' ? 'Ingreso' : m.movementType === 'Exit' ? 'Venta' : m.movementType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-bold text-white text-sm">{m.quantity}</TableCell>
                    <TableCell className="text-right pr-4">
                      <Button variant="ghost" size="icon" className="text-gray-500 hover:text-white hover:bg-rose-500/20 h-8 w-8" onClick={() => handleDeleteMovement(m)} title="Anular">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
