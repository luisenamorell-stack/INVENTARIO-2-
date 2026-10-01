"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card"
import { 
  Package, 
  Warehouse, 
  ArrowLeftRight,
  AlertCircle,
  Loader2,
  Truck,
  Wifi,
  WifiOff,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  FileText
} from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Link } from "react-router-dom"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/src/firebase"
import { collection, query, orderBy, limit, collectionGroup } from "firebase/firestore"
import { Progress } from "@/src/components/ui/progress"

import { PageShell } from "@/src/components/layout/page-shell"
import { cn } from "@/src/lib/utils"

import { Skeleton } from "@/src/components/ui/skeleton"

export default function Dashboard() {
  const firestore = useFirestore()
  const { user } = useUser()
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  const productsQuery = useMemoFirebase(() => firestore ? collection(firestore, "products") : null, [firestore])
  const warehousesQuery = useMemoFirebase(() => firestore ? collection(firestore, "warehouses") : null, [firestore])
  const allInventoryQuery = useMemoFirebase(() => firestore ? collectionGroup(firestore, "inventory") : null, [firestore])
  const movementsQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, "movements"), orderBy("timestamp", "desc"), limit(8)) : null, 
    [firestore]
  )
  
  const { data: products, isLoading: loadingProducts } = useCollection(productsQuery)
  const { data: warehouses, isLoading: loadingWarehouses } = useCollection(warehousesQuery)
  const { data: allInventory } = useCollection(allInventoryQuery)
  const { data: movements, isLoading: loadingMovements } = useCollection(movementsQuery)

  const activeWarehouseIds = React.useMemo(() => new Set(warehouses?.map(w => w.id) || []), [warehouses])
  
  const totalUnits = React.useMemo(() => {
    if (!allInventory) return 0
    return allInventory
      .filter(i => activeWarehouseIds.has(i.warehouseId))
      .reduce((acc, i) => acc + (Number(i.quantity) || 0), 0)
  }, [allInventory, activeWarehouseIds])

  const totalValue = React.useMemo(() => {
    if (!products || !allInventory) return 0
    const priceMap = new Map<string, number>()
    products.forEach(p => priceMap.set(p.id, Number(p.costPrice) || 0))
    
    return allInventory
      .filter(i => activeWarehouseIds.has(i.warehouseId))
      .reduce((acc, i) => {
        const price = priceMap.get(i.productId) || 0
        return acc + (price * (Number(i.quantity) || 0))
      }, 0)
  }, [products, allInventory, activeWarehouseIds])

  const criticalStock = React.useMemo(() => {
    if (!products || !allInventory) return 0
    const stockMap = new Map<string, number>()
    allInventory
      .filter(i => activeWarehouseIds.has(i.warehouseId))
      .forEach(i => {
        stockMap.set(i.productId, (stockMap.get(i.productId) || 0) + (Number(i.quantity) || 0))
      })
    
    return products.filter(p => (stockMap.get(p.id) || 0) < 5).length
  }, [products, allInventory, activeWarehouseIds])

  const stats = [
    {
      title: "Productos",
      value: loadingProducts ? "..." : (products?.length || 0).toString(),
      description: "Catálogo Maestro",
      icon: Package,
      color: "text-white",
      bg: "bg-cyan-700",
      trend: "Total registrado"
    },
    {
      title: "Bodegas/Camiones",
      value: loadingWarehouses ? "..." : (warehouses?.length || 0).toString(),
      description: "Unidades en Ruta",
      icon: Truck,
      color: "text-white",
      bg: "bg-emerald-700",
      trend: "Activas"
    },
    {
      title: "Valor Inventario",
      value: loadingProducts ? "..." : `L. ${totalValue.toLocaleString('es-HN', { minimumFractionDigits: 0 })}`,
      description: `${totalUnits.toLocaleString()} Unidades`,
      icon: DollarSign,
      color: "text-white",
      bg: "bg-emerald-700",
      trend: "Valuación actual"
    },
    {
      title: "Alertas Stock",
      value: loadingProducts ? "..." : criticalStock.toString(),
      description: "Críticos (< 5)",
      icon: AlertCircle,
      color: "text-white",
      bg: "bg-rose-600",
      trend: "Requieren atención"
    }
  ]

  const actions = (
    <div className="flex items-center gap-4">
      <Button asChild variant="outline" className="hidden sm:flex bg-white border-border text-slate-600 hover:bg-slate-50 h-11 px-6 font-bold uppercase tracking-widest text-[10px] transition-all shadow-sm">
        <Link to="/reportes" className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-cyan-600" />
          Reportes
        </Link>
      </Button>
      <Button asChild className="bg-cyan-700 hover:bg-cyan-800 text-white h-11 px-8 font-bold shadow-lg shadow-cyan-900/10 uppercase tracking-widest text-[10px] transition-all">
        <Link to="/movimientos" className="flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4" />
          Registrar Movimiento
        </Link>
      </Button>
    </div>
  )

  return (
    <PageShell 
      title="Dashboard General" 
      description="Resumen operativo en tiempo real"
      actions={actions}
    >
      {/* Columna Izquierda: Estadísticas y Actividad */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {loadingProducts || loadingWarehouses ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-[#12222e] to-[#0e1a24] border border-[#1e3848] rounded-2xl p-4 sm:p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl" />
                  <Skeleton className="h-3 w-10 sm:h-4 sm:w-12 rounded-full" />
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <Skeleton className="h-2 w-16 sm:h-3 sm:w-20" />
                  <Skeleton className="h-6 w-20 sm:h-8 sm:w-24" />
                </div>
              </div>
            ))
          ) : stats.map((stat) => (
            <div key={stat.title} className="bg-gradient-to-br from-[#12222e] to-[#0e1a24] border border-[#1e3848] rounded-2xl p-4 sm:p-6 shadow-xl hover:border-[#38bdf8]/40 transition-all group relative overflow-hidden">
              {/* Background accent */}
              <div className={cn("absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-5 blur-2xl transition-all group-hover:opacity-10", stat.bg)} />
              
              <div className="flex items-center justify-between mb-4 sm:mb-6 relative z-10">
                <div className={cn("p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-[#091016] border border-[#1e3848] text-[#38bdf8] group-hover:text-white group-hover:bg-[#38bdf8] transition-all duration-500 shadow-lg")}>
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="flex flex-col items-end">
                   <Badge className="bg-[#00a896]/10 text-[#00a896] border-none text-[7px] sm:text-[8px] font-black tracking-widest uppercase px-1.5 py-0">Online</Badge>
                </div>
              </div>
              
              <div className="flex flex-col relative z-10">
                <p className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider sm:tracking-[0.2em] mb-1">{stat.title}</p>
                <h3 className="text-xl sm:text-3xl font-black text-white mb-1 sm:mb-2 tracking-tight group-hover:scale-105 transition-transform origin-left duration-500 truncate">{stat.value}</h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                   <span className="text-[8px] sm:text-[10px] text-[#00a896] font-bold uppercase tracking-tight">{stat.trend}</span>
                   <span className="hidden sm:inline text-[9px] text-gray-600 font-medium">•</span>
                   <span className="text-[8px] sm:text-[9px] text-gray-600 font-bold uppercase tracking-tighter truncate">{stat.description}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reciente Activity */}
        <div className="bg-[#12222e] border border-[#1e3848] rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1e3848] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#38bdf8]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Movimientos Recientes</h3>
            </div>
            <Link to="/reconciliacion" className="text-[10px] font-bold text-[#00a896] hover:text-[#38bdf8] uppercase tracking-widest transition-colors">
              Ver Todo
            </Link>
          </div>
          <div className="divide-y divide-[#1e3848]">
            {loadingMovements ? (
              <div className="space-y-4 p-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="space-y-2 text-right">
                      <Skeleton className="h-4 w-8 ml-auto" />
                      <Skeleton className="h-3 w-12 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : movements?.length === 0 ? (
              <div className="py-12 text-center text-gray-500 italic text-xs">Sin actividad reciente</div>
            ) : (
              movements?.map((m) => (
                <div key={m.id} className="p-3 sm:p-4 flex items-center justify-between hover:bg-[#0e1a24]/40 transition-colors">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center ${m.type === 'entrada' ? 'bg-[#00a896]/10 text-[#00a896]' : 'bg-rose-500/10 text-rose-500'}`}>
                      {m.type === 'entrada' ? <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" /> : <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-200 truncate max-w-[120px] sm:max-w-none">{m.productName}</p>
                      <p className="text-[8px] sm:text-[10px] text-gray-500 uppercase font-semibold truncate">{m.warehouseName}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs sm:text-sm font-bold ${m.type === 'entrada' ? 'text-[#00a896]' : 'text-rose-500'}`}>
                      {m.type === 'entrada' ? '+' : '-'}{m.quantity}
                    </p>
                    <p className="text-[8px] sm:text-[9px] text-gray-600 font-bold uppercase">
                      {m.timestamp?.toDate().toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Columna Derecha: Estado de Unidades */}
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <div className="bg-[#12222e] border border-[#1e3848] rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <Truck className="h-5 w-5 text-[#38bdf8]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ocupación de Unidades</h3>
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            {loadingWarehouses ? (
              <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-[#00a896]" /></div>
            ) : warehouses?.map((w) => {
              const currentStock = allInventory
                ?.filter(i => i.warehouseId === w.id)
                .reduce((acc, i) => acc + (Number(i.quantity) || 0), 0) || 0;
              const maxCapacity = w.capacity || 500;
              const percentage = Math.min((currentStock / maxCapacity) * 100, 100);
              
              return (
                <div key={w.id} className="space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-bold text-gray-200 uppercase tracking-tight truncate">{w.name}</p>
                      <p className="text-[8px] sm:text-[9px] text-gray-500 font-bold uppercase truncate">{w.location}</p>
                    </div>
                    <p className="text-[10px] sm:text-xs font-bold text-[#38bdf8] shrink-0">{percentage.toFixed(1)}%</p>
                  </div>
                  <div className="h-1.5 sm:h-2 w-full bg-[#091016] rounded-full overflow-hidden border border-[#1e3848]">
                    <div 
                      className={`h-full transition-all duration-700 ${percentage > 90 ? 'bg-rose-500' : 'bg-[#00a896]'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[8px] sm:text-[9px] font-bold text-gray-600 uppercase">
                    <span>{currentStock} Unid.</span>
                    <span>Cap: {maxCapacity}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions (extra) */}
        <div className="bg-gradient-to-br from-[#12222e] to-[#0e1a24] border border-[#1e3848] rounded-xl p-6 shadow-lg">
          <h4 className="text-[10px] font-bold text-[#00a896] uppercase tracking-[0.2em] mb-4">Acceso Rápido</h4>
          <div className="grid grid-cols-2 gap-3">
             <Link to="/productos" className="p-3 rounded-lg bg-[#091016] border border-[#1e3848] hover:border-[#38bdf8] transition-all text-center">
                <Package className="h-4 w-4 text-[#38bdf8] mx-auto mb-2" />
                <span className="text-[9px] font-bold text-gray-400 uppercase">Productos</span>
             </Link>
             <Link to="/bodegas" className="p-3 rounded-lg bg-[#091016] border border-[#1e3848] hover:border-[#38bdf8] transition-all text-center">
                <Warehouse className="h-4 w-4 text-[#38bdf8] mx-auto mb-2" />
                <span className="text-[9px] font-bold text-gray-400 uppercase">Bodegas</span>
             </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
