"use client"

import * as React from "react"
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
  AlertCircle
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

export default function MovimientosPage() {
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const productsQuery = useMemoFirebase(() => firestore ? collection(firestore, "products") : null, [firestore])
  const warehousesQuery = useMemoFirebase(() => firestore ? collection(firestore, "warehouses") : null, [firestore])
  
  const { data: products } = useCollection(productsQuery)
  const { data: warehouses } = useCollection(warehousesQuery)

  const [items, setItems] = React.useState([{ id: Date.now(), productId: "", quantity: 1 }])
  const [movementType, setMovementType] = React.useState<"Entry" | "Exit" | "Transfer">("Entry")
  const [originWarehouseId, setOriginWarehouseId] = React.useState("")
  const [destinationWarehouseId, setDestinationWarehouseId] = React.useState("")
  const [authorizedBy, setAuthorizedBy] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [folio, setFolio] = React.useState<string>("")
  const [displayDate, setDisplayDate] = React.useState<string>("")
  const [productSearch, setProductSearch] = React.useState("")

  const filteredGroupedProducts = React.useMemo(() => {
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

  React.useEffect(() => {
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

      toast({ title: "Ficha Procesada", description: "Inventario actualizado correctamente." })
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
                  <SelectValue placeholder="Origen de mercancía" />
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
                  <SelectValue placeholder="Destino de mercancía" />
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
              <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider">
                <Package className="h-4 w-4 text-[#38bdf8]" />
                <span className="text-sm">Detalle de Artículos</span>
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

            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item, index) => (
                <div key={item.id} className="flex flex-col md:flex-row gap-4 items-center bg-[#091016]/40 p-4 rounded-xl border border-[#1e3848] group transition-all hover:border-[#38bdf8]/30">
                  <div className="hidden md:block w-8 text-center text-[10px] font-bold text-gray-600">{String(index + 1).padStart(2, '0')}</div>
                  <div className="flex-1 w-full">
                    <Select value={item.productId} onValueChange={(v) => handleUpdateItem(item.id, "productId", v)}>
                      <SelectTrigger className="w-full bg-[#091016] border border-[#1e3848] text-white text-xs h-10 px-4">
                        <SelectValue placeholder="Seleccionar producto..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] bg-[#12222e] border-[#1e3848] text-white">
                        <ScrollArea className="h-[250px]">
                          {Object.entries(filteredGroupedProducts as any).map(([category, prods]: [string, any]) => (
                            <SelectGroup key={category}>
                              <SelectLabel className="bg-[#0e1a24] text-[9px] font-bold uppercase text-[#00a896] tracking-widest p-2 mb-1">{category}</SelectLabel>
                              {prods.map((p: any) => (
                                <SelectItem key={p.id} value={p.id} className="hover:bg-[#1e3240] focus:bg-[#1e3240] text-xs">
                                  <span className="font-mono text-[#38bdf8] mr-2">[{p.sku}]</span> {p.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-32 flex items-center gap-3">
                    <div className="relative flex-1">
                       <input 
                        type="number" 
                        value={item.quantity} 
                        onChange={e => handleUpdateItem(item.id, "quantity", e.target.value)} 
                        className="w-full bg-[#091016] border border-[#1e3848] rounded-lg px-4 py-2 text-sm text-white text-center focus:border-[#00a896] outline-none font-bold" 
                      />
                      <span className="absolute -top-2 left-3 bg-[#12222e] px-1 text-[8px] font-bold text-[#00a896] uppercase tracking-widest">CANT</span>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-gray-500 hover:text-rose-500 transition-colors"
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
          className="w-full bg-[#2a7b9b] hover:bg-[#236883] text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed group"
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
    </PageShell>
  );
}
