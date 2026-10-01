"use client"

import * as React from "react"
import { 
  Warehouse, 
  MapPin, 
  Plus, 
  ArrowRight, 
  Box,
  Loader2,
  Truck,
  Edit2,
  Trash2
} from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog"
import { Label } from "@/src/components/ui/label"
import { Input } from "@/src/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
import { useToast } from "@/src/hooks/use-toast"
import { useFirestore, useCollection, useMemoFirebase } from "@/src/firebase"
import { collection, doc, serverTimestamp } from "firebase/firestore"
import { setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/src/firebase/non-blocking-updates"
import { Link } from "react-router-dom"

import { PageShell } from "@/src/components/layout/page-shell"

export default function BodegasPage() {
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const warehousesQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return collection(firestore, "warehouses")
  }, [firestore])

  const { data: warehouses, isLoading } = useCollection(warehousesQuery)

  const [isOpen, setIsOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState({
    name: "",
    type: "Camion",
    location: "",
    capacity: 500,
    description: ""
  })

  const handleSaveWarehouse = () => {
    if (!formData.name || !formData.location || !formData.capacity) {
      toast({
        title: "Error",
        description: "Nombre, ubicación y capacidad son obligatorios.",
        variant: "destructive"
      })
      return
    }

    if (!firestore) return

    if (editingId) {
      const data = {
        ...formData,
        updatedAt: serverTimestamp()
      }
      updateDocumentNonBlocking(doc(firestore, "warehouses", editingId), data)
      toast({ title: "Unidad Actualizada", description: `Los cambios en ${formData.name} han sido guardados.`, type: "success" })
    } else {
      const id = doc(collection(firestore, "warehouses")).id
      const data = {
        id,
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      setDocumentNonBlocking(doc(firestore, "warehouses", id), data, { merge: true })
      toast({ title: "Unidad Registrada", description: `La unidad ${formData.name} ha sido creada correctamente.`, type: "success" })
    }
    
    closeDialog()
  }

  const handleEdit = (wh: any) => {
    setEditingId(wh.id)
    setFormData({
      name: wh.name || "",
      type: wh.type || "Camion",
      location: wh.location || "",
      capacity: wh.capacity || 500,
      description: wh.description || ""
    })
    setIsOpen(true)
  }

  const handleDelete = (wh: any) => {
    if (!firestore) return
    if (window.confirm(`¿Estás seguro de eliminar "${wh.name}"? Esta acción no se puede deshacer.`)) {
      deleteDocumentNonBlocking(doc(firestore, "warehouses", wh.id))
      toast({ 
        title: "Unidad Eliminada", 
        description: `${wh.name} ha sido removido del sistema.`,
        variant: "destructive"
      })
    }
  }

  const closeDialog = () => {
    setIsOpen(false)
    setEditingId(null)
    setFormData({ name: "", type: "Camion", location: "", capacity: 500, description: "" })
  }

  const actions = (
    <button 
      onClick={() => setIsOpen(true)}
      className="bg-[#2a7b9b] hover:bg-[#236883] text-white h-11 px-6 font-bold shadow-lg shadow-[#2a7b9b]/10 uppercase tracking-widest text-[11px] rounded-lg transition-all flex items-center gap-2"
    >
      <Plus className="h-4 w-4" /> Nueva Unidad
    </button>
  )

  return (
    <PageShell
      title="Unidades de Negocio"
      description="Administración de bodegas centrales y unidades móviles de venta"
      actions={actions}
    >

      {isLoading ? (
        <div className="col-span-12 flex items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-[#00a896]" />
          <p className="ml-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">Sincronizando unidades...</p>
        </div>
      ) : (
        <div className="col-span-12 grid gap-6 md:grid-cols-2">
          {warehouses?.map((wh) => (
            <div key={wh.id} className="bg-[#12222e] border border-[#1e3848] rounded-xl overflow-hidden shadow-lg transition-all hover:border-[#38bdf8]/40 group">
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-lg sm:rounded-xl bg-[#091016] border border-[#1e3848] flex items-center justify-center text-[#38bdf8] shadow-inner group-hover:scale-105 transition-transform">
                      {wh.type === 'Bodega' ? <Warehouse className="h-5 w-5 sm:h-7 sm:w-7" /> : <Truck className="h-5 w-5 sm:h-7 sm:w-7" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-lg font-bold text-white uppercase tracking-tight leading-tight truncate max-w-[150px] sm:max-w-none">{wh.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
                        <MapPin className="h-2.5 w-2.5 text-[#00a896]" />
                        <span className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">{wh.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded sm:rounded-md text-[8px] sm:text-[9px] font-bold uppercase tracking-widest shrink-0 ${wh.type === 'Bodega' ? 'bg-[#00a896]/10 text-[#00a896]' : 'bg-[#38bdf8]/10 text-[#38bdf8]'}`}>
                    {wh.type || 'Bodega'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-[#091016] border border-[#1e3848] rounded-lg p-2.5 sm:p-4">
                    <p className="text-[7px] sm:text-[8px] font-bold text-gray-600 uppercase tracking-wider mb-0.5 sm:mb-1">Capacidad</p>
                    <p className="text-xs sm:text-sm font-bold text-white">{wh.capacity || 500} <span className="text-[8px] sm:text-[10px] text-gray-500 uppercase font-semibold">Units</span></p>
                  </div>
                  <div className="bg-[#091016] border border-[#1e3848] rounded-lg p-2.5 sm:p-4">
                    <p className="text-[7px] sm:text-[8px] font-bold text-gray-600 uppercase tracking-wider mb-0.5 sm:mb-1">Estado</p>
                    <p className="text-xs sm:text-sm font-bold text-[#00a896]">ACTIVO</p>
                  </div>
                </div>

                {wh.description && (
                  <p className="text-xs text-gray-400 mb-6 line-clamp-2 italic">
                    "{wh.description}"
                  </p>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 sm:pt-6 border-t border-[#1e3848]">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(wh)}
                      className="flex-1 sm:flex-none p-2.5 rounded-lg border border-[#1e3848] text-gray-500 hover:text-[#38bdf8] hover:bg-[#1e3240] transition-all flex justify-center items-center"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(wh)}
                      className="flex-1 sm:flex-none p-2.5 rounded-lg border border-[#1e3848] text-gray-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all flex justify-center items-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Link 
                    to={`/reconciliacion?bodega=${wh.id}`}
                    className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-[#2a7b9b] hover:bg-[#236883] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all shadow-md active:scale-95"
                  >
                    Abrir Planilla <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
          
          {!warehouses?.length && (
            <div className="col-span-full py-20 bg-[#12222e] border border-dashed border-[#1e3848] rounded-xl text-center">
              <Box className="h-12 w-12 mx-auto text-gray-700 mb-4" />
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Sin unidades registradas</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl bg-[#12222e] border-[#1e3848] text-white shadow-2xl p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-[#38bdf8] uppercase tracking-tight">
              {editingId ? "Editar" : "Nueva"} Unidad
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-xs font-semibold uppercase tracking-wider mt-2">
              Configuración técnica de almacén o transporte
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00a896]">Tipo de Estructura</label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                  <SelectTrigger className="w-full bg-[#091016] border border-[#1e3848] text-white h-12 rounded-lg font-bold">
                    <SelectValue placeholder="Seleccionar...">
                      {formData.type === "Bodega" ? "Bodega (Almacén)" : "Camión (Móvil)"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#12222e] border-[#1e3848] text-white">
                    <SelectItem value="Bodega" className="text-xs font-bold uppercase">Bodega (Almacén)</SelectItem>
                    <SelectItem value="Camion" className="text-xs font-bold uppercase">Camión (Móvil)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00a896]">Capacidad (Unid.)</label>
                <input 
                  type="number"
                  className="w-full bg-[#091016] border border-[#1e3848] rounded-lg px-4 py-3 text-sm text-white focus:border-[#00a896] outline-none font-bold"
                  value={formData.capacity}
                  onChange={e => setFormData({...formData, capacity: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00a896]">Nombre de Unidad</label>
              <input 
                className="w-full bg-[#091016] border border-[#1e3848] rounded-lg px-4 py-3 text-sm text-white focus:border-[#00a896] outline-none font-bold uppercase"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00a896]">Ubicación / Ruta Base</label>
              <input 
                className="w-full bg-[#091016] border border-[#1e3848] rounded-lg px-4 py-3 text-sm text-white focus:border-[#00a896] outline-none font-semibold uppercase"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00a896]">Notas Adicionales</label>
              <textarea 
                className="w-full bg-[#091016] border border-[#1e3848] rounded-lg px-4 py-3 text-sm text-white focus:border-[#00a896] outline-none min-h-[80px] resize-none"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter className="mt-10 gap-3">
            <button onClick={closeDialog} className="flex-1 py-3 border border-[#1e3848] hover:bg-[#182c3c] text-gray-400 font-bold rounded-lg transition-all uppercase tracking-widest text-[10px]">
              Descartar
            </button>
            <button onClick={handleSaveWarehouse} className="flex-[2] py-3 bg-[#2a7b9b] hover:bg-[#236883] text-white font-bold rounded-lg shadow-lg transition-all uppercase tracking-widest text-[10px]">
              Confirmar Registro
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
