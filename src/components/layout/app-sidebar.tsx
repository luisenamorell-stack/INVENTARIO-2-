import * as React from "react"
import {
  LayoutDashboard,
  Box,
  Warehouse,
  ArrowLeftRight,
  ClipboardCheck,
  BarChart3,
  Settings,
  PackageSearch,
  ScanBarcode
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
  useSidebar
} from "@/src/components/ui/sidebar"

const navigationItems = [
  { title: "Dashboard", icon: LayoutDashboard, url: "/" },
  { title: "Productos", icon: Box, url: "/productos" },
  { title: "Bodegas", icon: Warehouse, url: "/bodegas" },
  { title: "Conteo Físico", icon: ScanBarcode, url: "/conteo" },
  { title: "Movimientos", icon: ArrowLeftRight, url: "/movimientos" },
  { title: "Cuadre Semanal", icon: ClipboardCheck, url: "/reconciliacion" },
  { title: "Reportes", icon: BarChart3, url: "/reportes" },
]

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="bg-[#0e1a24] text-gray-200 overflow-hidden">
      <SidebarHeader className="bg-[#0e1a24] p-4">
        {/* Brand Logo Container - Circular as in reference */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#2a7b9b] to-[#1e3848] flex items-center justify-center text-white shadow-xl shrink-0 border border-[#38bdf8]/30">
              <PackageSearch className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300 truncate">
                <span className="text-[12px] font-black text-white uppercase tracking-tighter">
                  COMERCIAL
                </span>
                <span className="text-[9px] font-bold text-[#38bdf8] uppercase tracking-[0.2em] -mt-1">
                  MILAGRO
                </span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <div className="px-2 py-1 bg-[#091016]/50 rounded-md border border-[#1e3848] animate-in fade-in slide-in-from-top-1 duration-500">
              <span className="text-[7px] font-bold text-[#00a896] uppercase tracking-[0.4em] block text-center">
                StockFlow Pro
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[#0e1a24] px-2 mt-4 custom-scrollbar overflow-x-hidden">
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.3em] px-3 mb-2 animate-in fade-in duration-500">
              Panel de Control
            </SidebarGroupLabel>
          )}
          <SidebarMenu className="gap-1">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                    className={`
                      w-full flex items-center gap-3 px-3 py-5 rounded-xl transition-all duration-300 group relative overflow-hidden
                      ${isActive 
                        ? 'bg-[#2a7b9b] text-white shadow-lg shadow-[#2a7b9b]/20' 
                        : 'text-gray-500 hover:text-white hover:bg-[#12222e]'}
                    `}
                  >
                    <Link to={item.url}>
                      <item.icon className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#38bdf8]'}`} />
                      {!isCollapsed && (
                        <span className="text-[11px] font-bold tracking-wide truncate animate-in fade-in slide-in-from-left-1 duration-300">
                          {item.title}
                        </span>
                      )}
                      {isActive && !isCollapsed && (
                        <div className="absolute left-0 w-1 h-5 bg-white rounded-r-full" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-[#0e1a24] p-2 border-t border-[#1e3240]/30">
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === "/configuracion"}
              tooltip="Configuración"
              className={`
                w-full flex items-center gap-3 px-3 py-5 rounded-xl transition-all duration-300 group overflow-hidden
                ${location.pathname === "/configuracion" 
                  ? 'bg-[#2a7b9b] text-white' 
                  : 'text-gray-500 hover:text-white hover:bg-[#12222e]'}
              `}
            >
              <Link to="/configuracion">
                <Settings className={`h-5 w-5 shrink-0 ${location.pathname === "/configuracion" ? 'text-white' : 'text-gray-500 group-hover:text-[#38bdf8]'}`} />
                {!isCollapsed && (
                  <span className="text-[11px] font-bold tracking-wide truncate animate-in fade-in slide-in-from-left-1 duration-300">
                    Configuración
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* User Info Section */}
          {!isCollapsed && (
            <div className="mt-4 px-3 py-3 bg-[#12222e]/50 rounded-xl border border-[#1e3848] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="h-7 w-7 rounded-full bg-[#00a896] flex items-center justify-center text-[9px] font-black text-white shrink-0">
                LM
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-white truncate">Luis Namorell</span>
                <span className="text-[7px] font-medium text-gray-500 uppercase tracking-widest truncate">Admin</span>
              </div>
            </div>
          )}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
