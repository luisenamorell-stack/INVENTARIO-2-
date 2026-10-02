import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/src/components/ui/sidebar';
import { AppSidebar } from '@/src/components/layout/app-sidebar';
import { Toaster } from '@/src/components/ui/toast';
import { Separator } from '@/src/components/ui/separator';
import { ModeToggle } from '@/src/components/mode-toggle';
import { Breadcrumbs } from '@/src/components/layout/breadcrumbs';
import { WifiOff, Loader2, PackageSearch, Cloud, Sun, Moon, Search, Plus, Menu } from 'lucide-react';
import { PWAInstallButton } from '@/src/components/pwa-install-button';
import { BottomNav } from '@/src/components/layout/bottom-nav';

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Productos = React.lazy(() => import('./pages/Productos'));
const Bodegas = React.lazy(() => import('./pages/Bodegas'));
const Movimientos = React.lazy(() => import('./pages/Movimientos'));
const Reconciliacion = React.lazy(() => import('./pages/Reconciliacion'));
const Reportes = React.lazy(() => import('./pages/Reportes'));
const Conteo = React.lazy(() => import('./pages/Conteo'));
const Configuracion = React.lazy(() => import('./pages/Configuracion'));
const Consulta = React.lazy(() => import('./pages/Consulta'));

import { TooltipProvider } from '@/src/components/ui/tooltip';
import { ThemeProvider, useTheme } from '@/src/components/theme-provider';

export default function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <SidebarProvider defaultOpen={true}>
          <Router>
            <AppLayout />
            <Toaster />
          </Router>
        </SidebarProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

function AppLayout() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const location = useLocation();

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const hideFabPaths = ['/conteo', '/movimientos'];
  const showFab = !hideFabPaths.includes(location.pathname);

  return (
    <>
      <AppSidebar />
      <SidebarInset className="flex-1 flex flex-col min-h-screen overflow-hidden bg-[#0b1319] pb-16 lg:pb-0">
        {/* Header Superior */}
        <header className="w-full h-14 sm:h-16 bg-[#0e1a24] border-b border-[#1e3240] px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-40 safe-area-top">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger className="text-[#38bdf8] hover:bg-[#12222e] lg:hidden" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-[#2a7b9b] flex lg:hidden items-center justify-center text-white shadow-lg shrink-0 border border-[#38bdf8]/30">
                  <PackageSearch className="h-4 w-4" />
                </div>
                <span className="text-[11px] sm:text-[14px] font-black text-white uppercase tracking-tighter truncate max-w-[100px] sm:max-w-none">
                  Comercial <span className="text-[#38bdf8]">Milagro</span>
                </span>
              </div>
              <div className="flex items-center gap-2 hidden sm:flex">
                <Breadcrumbs />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 max-w-md ml-8 hidden lg:flex">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-[#38bdf8] transition-colors" />
              <input 
                type="text" 
                placeholder="BUSCAR EN EL SISTEMA... (ALT+S)" 
                className="w-full bg-[#091016] border border-[#1e3240] rounded-xl pl-10 pr-4 py-2 text-[10px] text-white focus:border-[#38bdf8] outline-none font-bold tracking-widest transition-all placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <div className="hidden sm:block">
              <PWAInstallButton />
            </div>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#00a896]/10 text-[#00a896] border border-[#00a896]/20">
                  <Cloud className="h-3 w-3" />
                  <span className="text-[8px] font-bold uppercase tracking-widest hidden xs:inline">Sync</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <WifiOff className="h-3 w-3" />
                  <span className="text-[8px] font-bold uppercase tracking-widest hidden xs:inline">Local</span>
                </div>
              )}
            </div>
            <div className="hidden xs:block">
              <ModeToggle />
            </div>
          </div>
        </header>
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#0b1319] scrollbar-minimal">
          {!isOnline && (
            <div className="bg-rose-600 text-white text-[10px] py-1 text-center font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 z-[100] animate-pulse sticky top-0 shadow-lg">
              <WifiOff className="h-3 w-3" /> Modo Offline Activo: Los cambios se guardarán localmente
            </div>
          )}
          
          <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-full gap-4 text-gray-500">
              <Loader2 className="h-12 w-12 animate-spin text-[#00a896]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.4em]">Cargando Sistema...</p>
            </div>
          }>
            <div className="w-full relative min-h-full">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/productos" element={<Productos />} />
                <Route path="/bodegas" element={<Bodegas />} />
                <Route path="/movimientos" element={<Movimientos />} />
                <Route path="/reconciliacion" element={<Reconciliacion />} />
                <Route path="/reportes" element={<Reportes />} />
                <Route path="/conteo" element={<Conteo />} />
                <Route path="/consulta" element={<Consulta />} />
                <Route path="/configuracion" element={<Configuracion />} />
              </Routes>

              {/* Floating Action Button for Inventory Management */}
              {showFab && (
                <Link 
                  to="/movimientos" 
                  className="fixed bottom-24 lg:bottom-8 right-4 lg:right-8 h-12 w-12 lg:h-14 lg:w-14 rounded-full bg-[#2a7b9b] text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 hover:bg-[#236883] transition-all z-[40] border-2 border-[#38bdf8]/20 group"
                  title="Registrar Movimiento Rápido"
                >
                  <Plus className="h-5 w-5 lg:h-6 lg:w-6 group-hover:rotate-90 transition-transform duration-500" />
                </Link>
              )}
            </div>
          </React.Suspense>
        </div>
        <BottomNav />
      </SidebarInset>
    </>
  );
}
