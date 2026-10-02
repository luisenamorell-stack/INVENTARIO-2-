"use client"

import * as React from "react"
import { useUser } from "@/src/firebase"
import { Button } from "@/src/components/ui/button"
import { PackageSearch, LogIn, Loader2, ShieldCheck, Warehouse } from "lucide-react"

export default function LoginPage() {
  const { loginWithGoogle, isUserLoading } = useUser()
  const [isLoggingIn, setIsLoggingIn] = React.useState(false)

  const handleLogin = async () => {
    setIsLoggingIn(true)
    try {
      await loginWithGoogle()
    } catch (error) {
      console.error(error)
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0b1319] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#2a7b9b]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#00a896]/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-[#2a7b9b] to-[#1e3848] flex items-center justify-center text-white shadow-2xl border border-[#38bdf8]/30 transform rotate-12 hover:rotate-0 transition-transform duration-500">
              <PackageSearch className="h-10 w-10" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
              Comercial <span className="text-[#38bdf8]">Milagro</span>
            </h1>
            <div className="inline-block px-3 py-1 bg-[#091016]/50 rounded-md border border-[#1e3848]">
              <span className="text-[10px] font-bold text-[#00a896] uppercase tracking-[0.4em]">
                StockFlow Pro
              </span>
            </div>
          </div>

          <p className="text-gray-400 text-sm max-w-[280px] mx-auto leading-relaxed">
            Sistema centralizado de inventarios para bodegas y unidades en ruta.
          </p>
        </div>

        <div className="bg-[#12222e] border border-[#1e3848] rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-[#091016]/50 rounded-2xl border border-[#1e3848]">
              <div className="h-10 w-10 rounded-xl bg-[#38bdf8]/10 flex items-center justify-center text-[#38bdf8]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Acceso Seguro</p>
                <p className="text-xs text-gray-300 font-medium">Autenticación vía Google Workspace</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-[#091016]/50 rounded-2xl border border-[#1e3848]">
              <div className="h-10 w-10 rounded-xl bg-[#00a896]/10 flex items-center justify-center text-[#00a896]">
                <Warehouse className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tiempo Real</p>
                <p className="text-xs text-gray-300 font-medium">Sincronización de stock multi-bodega</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleLogin}
            disabled={isLoggingIn || isUserLoading}
            className="w-full bg-[#2a7b9b] hover:bg-[#236883] text-white h-14 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs shadow-xl shadow-[#2a7b9b]/20 transition-all flex items-center justify-center gap-3"
          >
            {isLoggingIn ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Ingresar al Sistema
              </>
            )}
          </Button>
        </div>

        <div className="text-center">
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
            © 2026 Comercial Milagro • v1.0.4-stable
          </p>
        </div>
      </div>
    </div>
  )
}
