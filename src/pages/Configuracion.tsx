"use client"

import * as React from "react"
import { 
  Settings, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Loader2,
  Cloud,
  HardDrive,
  Info
} from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { useFirebase, useUser, useFirestore } from "@/src/firebase"
import firebaseConfig from "@/firebase-applet-config.json"
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert"
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore"

import { PageShell } from "@/src/components/layout/page-shell"

export default function ConfiguracionPage() {
  const firebase = useFirebase()
  const firestore = useFirestore()
  const { user, isUserLoading } = useUser()
  const [isSeeding, setIsSeeding] = React.useState(false)

  const isFirestoreConnected = !!firebase?.firestore
  const isAuthActive = !!user
  const isAdmin = user?.email?.toLowerCase() === 'luisenamorell@gmail.com'

  const seedData = async () => {
    if (!firestore || isSeeding) return
    setIsSeeding(true)
    try {
      // Create a test connection doc
      await setDoc(doc(firestore, "test", "connection"), { active: true, timestamp: serverTimestamp() })
      
      // Create initial warehouse
      const whId = "W001"
      await setDoc(doc(firestore, "warehouses", whId), {
        id: whId,
        name: "Bodega Principal",
        type: "Bodega",
        location: "Centro",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // Create some products
      const demoProducts = [
        { sku: "001", name: "Cama King Size", category: "Camas", costPrice: 5500 },
        { sku: "002", name: "Estante Metálico", category: "Muebles", costPrice: 1200 },
        { sku: "003", name: "Silla Ergonómica", category: "Oficina", costPrice: 2500 }
      ]

      for (const p of demoProducts) {
        const pid = doc(collection(firestore, "products")).id
        await setDoc(doc(firestore, "products", pid), {
          ...p,
          id: pid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      }

      alert("Datos iniciales cargados con éxito. Recarga la página.")
    } catch (e) {
      console.error(e)
      alert("Error al cargar datos: " + (e as any).message)
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <PageShell
      title="Centro de Control"
      description="Monitoreo de sincronización, estado del sistema y configuración técnica"
    >

      <div className="col-span-12">
        <div className="bg-[#12222e] border border-[#1e3848] rounded-xl p-4 sm:p-6 shadow-lg flex gap-3 sm:gap-4 items-start">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[#00a896]/10 flex items-center justify-center text-[#00a896] shrink-0">
            <Info className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <h4 className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider mb-1">Nota sobre Actualizaciones</h4>
            <p className="text-[10px] sm:text-xs text-gray-400 leading-relaxed italic">
              Tus precios e inventarios se sincronizan en tiempo real sin necesidad de publicar. 
              Solo es necesario publicar si se realizan cambios estructurales en el diseño o funciones principales.
            </p>
          </div>
        </div>
      </div>

      <div className="col-span-12 grid gap-6 md:grid-cols-2">
        <div className="bg-[#12222e] border border-[#1e3848] rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-[#1e3848] bg-[#0e1a24]/30">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-3">
              <Cloud className="h-5 w-5 text-[#38bdf8]" /> Sincronización de Datos
            </h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Estado de la nube y base de datos activa</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#091016] border border-[#1e3848] rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Conexión a Firestore</span>
              <Badge className={`gap-2 px-3 py-1 text-[9px] font-bold uppercase tracking-widest border-none text-white ${isFirestoreConnected ? 'bg-[#00a896]/20 text-[#00a896]' : 'bg-rose-500/20 text-rose-500'}`}>
                {isFirestoreConnected ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                {isFirestoreConnected ? "Activa" : "Error"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#091016] border border-[#1e3848] rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">ID del Proyecto</span>
              <span className="text-xs font-bold font-mono text-[#38bdf8]">{firebaseConfig.projectId}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#091016] border border-[#1e3848] rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Sesión de Usuario</span>
              {isUserLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#00a896]" />
              ) : (
                <Badge className={`gap-2 px-3 py-1 text-[9px] font-bold uppercase tracking-widest border-none text-white ${isAuthActive ? 'bg-[#2a7b9b]/20 text-[#2a7b9b]' : 'bg-gray-800 text-gray-500'}`}>
                  {isAuthActive ? "Conectada" : "Anónima"}
                </Badge>
              )}
            </div>
          </div>
          <div className="p-6 bg-[#0e1a24]/30 border-t border-[#1e3848]">
             <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2 italic">
               <Info className="h-3 w-3" /> Los cambios en inventario se procesan vía gRPC en tiempo real.
             </p>
          </div>
        </div>

        <div className="bg-[#12222e] border border-[#1e3848] rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-[#1e3848] bg-[#0e1a24]/30">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-[#00a896]" /> Persistencia Local
            </h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Capacidad de trabajo sin internet</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="p-5 bg-[#091016] border border-[#00a896]/20 rounded-lg space-y-3">
              <div className="flex items-center gap-3 text-[#00a896] font-bold uppercase tracking-widest text-[10px]">
                <CheckCircle2 className="h-4 w-4" /> Almacenamiento Offline Activo
              </div>
              <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic">
                La aplicación guarda una copia de los datos en el dispositivo. Tus camiones pueden operar en zonas sin señal y los cambios se subirán solos al detectar internet.
              </p>
            </div>
            
            <button 
              onClick={() => window.location.reload()}
              className="w-full h-12 bg-transparent border border-[#1e3848] hover:bg-[#182c3c] text-[#38bdf8] font-bold uppercase tracking-widest text-[10px] rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className="h-4 w-4" /> Forzar Re-sincronización
            </button>

            {isAdmin && (
              <div className="pt-4 border-t border-[#1e3848]">
                <button 
                  onClick={seedData}
                  disabled={isSeeding}
                  className="w-full h-12 bg-[#00a896]/10 border border-[#00a896]/30 hover:bg-[#00a896]/20 text-[#00a896] font-bold uppercase tracking-widest text-[10px] rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDrive className="h-4 w-4" />}
                  Cargar Datos de Prueba (Seed)
                </button>
                <p className="text-[8px] text-gray-600 font-bold uppercase text-center mt-2">Visible solo para administradores</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
