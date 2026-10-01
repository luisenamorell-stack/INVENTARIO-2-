"use client"

import * as React from "react"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download,
  Filter,
  FileText,
  Inbox
} from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/src/components/ui/chart"
import { Badge } from "@/src/components/ui/badge"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { useFirestore, useCollection, useMemoFirebase } from "@/src/firebase"
import { collection } from "firebase/firestore"

const chartData: any[] = []

const chartConfig = {
  entries: {
    label: "Entradas",
    color: "#00a896",
  },
  exits: {
    label: "Salidas",
    color: "#2a7b9b",
  },
} satisfies ChartConfig

import { PageShell } from "@/src/components/layout/page-shell"

export default function ReportesPage() {
  const firestore = useFirestore()
  const warehousesQuery = useMemoFirebase(() => firestore ? collection(firestore, "warehouses") : null, [firestore])
  const { data: warehouses } = useCollection(warehousesQuery)
  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState("todas")

  const actions = (
    <div className="flex gap-4">
      <button className="border border-[#1e3848] hover:bg-[#182c3c] text-[#38bdf8] py-2.5 px-6 rounded-lg transition-all font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
        <Filter className="h-4 w-4" /> Filtros Avanzados
      </button>
      <button className="bg-[#2a7b9b] hover:bg-[#236883] text-white font-bold py-2.5 px-8 rounded-lg shadow-lg transition-all uppercase tracking-widest text-[10px] flex items-center gap-2">
        <Download className="h-4 w-4" /> Exportar a PDF
      </button>
    </div>
  )

  return (
    <PageShell
      title="Analítica y Reportes"
      description="Análisis profundo de stock, movimientos y rendimiento por unidad"
      actions={actions}
    >
      <div className="col-span-12 grid gap-6 md:grid-cols-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00a896]">Bodega o Unidad</label>
          <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
            <SelectTrigger className="bg-[#091016] border border-[#1e3848] text-white h-11 rounded-lg font-bold">
              <SelectValue placeholder="Todas las bodegas">
                {selectedWarehouseId === "todas" ? "Todas las Unidades" : (warehouses?.find(w => w.id === selectedWarehouseId)?.name || "Todas las Unidades")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-[#12222e] border-[#1e3848] text-white">
              <SelectItem value="todas" className="text-xs font-bold uppercase">Todas las Unidades</SelectItem>
              {warehouses?.map(w => (
                <SelectItem key={w.id} value={w.id} className="text-xs font-bold uppercase">{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00a896]">Período de Análisis</label>
          <Select defaultValue="semanal">
            <SelectTrigger className="bg-[#091016] border border-[#1e3848] text-white h-11 rounded-lg font-bold">
              <SelectValue placeholder="Seleccionar período">
                Última Semana
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-[#12222e] border-[#1e3848] text-white">
              <SelectItem value="diario" className="text-xs font-bold uppercase">Hoy</SelectItem>
              <SelectItem value="semanal" className="text-xs font-bold uppercase">Última Semana</SelectItem>
              <SelectItem value="mensual" className="text-xs font-bold uppercase">Último Mes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="col-span-12 grid gap-6 md:grid-cols-2">
        <div className="bg-[#12222e] border border-[#1e3848] rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-[#1e3848] bg-[#0e1a24]/30">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Flujo de Inventario</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Comparativa dinámica de entradas vs salidas</p>
          </div>
          <div className="h-[350px] w-full p-8 flex items-center justify-center">
            {chartData.length === 0 ? (
              <div className="text-center space-y-4">
                <div className="h-16 w-16 mx-auto bg-[#091016] rounded-full flex items-center justify-center border border-[#1e3848]">
                  <Inbox className="h-6 w-6 text-gray-700" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Datos insuficientes</p>
                </div>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e3848" opacity={0.3} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 900 }}
                    tickFormatter={(value) => value.slice(0, 3).toUpperCase()}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dashed" className="bg-[#12222e] border-[#1e3848]" />}
                  />
                  <Bar dataKey="entries" fill="#00a896" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="exits" fill="#2a7b9b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </div>

        <div className="bg-[#12222e] border border-[#1e3848] rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-[#1e3848] bg-[#0e1a24]/30">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Métricas de Rendimiento</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Indicadores clave de eficiencia</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-5 bg-[#091016] border border-[#1e3848] rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-[#12222e] border border-[#1e3848] flex items-center justify-center text-[#00a896]">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1">Valoración Total</p>
                  <p className="text-2xl font-bold text-white tracking-tight">L. 0.00</p>
                </div>
              </div>
              <Badge className="bg-[#12222e] text-gray-500 border border-[#1e3848] text-[8px] font-bold uppercase tracking-widest">N/A</Badge>
            </div>

            <div className="flex items-center justify-between p-5 bg-[#091016] border border-[#1e3848] rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-[#12222e] border border-[#1e3848] flex items-center justify-center text-rose-500">
                  <TrendingDown className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1">Rotación Mensual</p>
                  <p className="text-2xl font-bold text-white tracking-tight">0.0x</p>
                </div>
              </div>
              <Badge className="bg-[#12222e] text-rose-500 border border-rose-500/30 text-[8px] font-bold uppercase tracking-widest">Baja</Badge>
            </div>

            <div className="flex items-center justify-between p-5 bg-[#091016] border border-[#1e3848] rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-[#12222e] border border-[#1e3848] flex items-center justify-center text-[#38bdf8]">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1">Exactitud Cuadre</p>
                  <p className="text-2xl font-bold text-white tracking-tight">100%</p>
                </div>
              </div>
              <Badge className="bg-[#00a896]/10 text-[#00a896] border border-[#00a896]/20 text-[8px] font-bold uppercase tracking-widest">Óptimo</Badge>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
