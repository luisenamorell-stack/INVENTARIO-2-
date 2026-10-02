import * as React from "react"
import { 
  LayoutDashboard, 
  Box, 
  Warehouse, 
  ScanBarcode, 
  ArrowLeftRight,
  ClipboardCheck,
  Settings,
  Search
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/src/lib/utils"

const navItems = [
  { title: "Inicio", icon: LayoutDashboard, url: "/" },
  { title: "Consultar", icon: Search, url: "/consulta" },
  { title: "Escanear", icon: ScanBarcode, url: "/conteo", primary: true },
  { title: "Productos", icon: Box, url: "/productos" },
  { title: "Kardex", icon: ClipboardCheck, url: "/reconciliacion" },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0e1a24]/95 backdrop-blur-md border-t border-[#1e3240] px-2 h-16 safe-area-bottom">
      <div className="flex items-center justify-around h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url
          
          if (item.primary) {
            return (
              <Link 
                key={item.url} 
                to={item.url}
                className="relative -top-5"
              >
                <div className={cn(
                  "h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 border-4 border-[#0b1319]",
                  isActive ? "bg-[#38bdf8] text-white scale-110" : "bg-[#2a7b9b] text-white"
                )}>
                  <item.icon className="h-6 w-6" />
                </div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                  {item.title}
                </span>
              </Link>
            )
          }

          return (
            <Link 
              key={item.url} 
              to={item.url} 
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-2 py-1 transition-all duration-300 min-w-[64px]",
                isActive ? "text-[#38bdf8]" : "text-gray-500 hover:text-gray-300"
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
              <span className={cn("text-[9px] font-bold uppercase tracking-tight", isActive ? "text-[#38bdf8]" : "text-gray-600")}>
                {item.title}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-[#38bdf8] mt-0.5" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
