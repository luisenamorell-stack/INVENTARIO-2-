import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { ChevronRight, Home } from "lucide-react"

const routeMap: Record<string, string> = {
  "": "Dashboard",
  "productos": "Productos",
  "bodegas": "Bodegas",
  "movimientos": "Movimientos",
  "reconciliacion": "Reconciliación",
  "reportes": "Reportes",
  "configuracion": "Configuración",
}

export function Breadcrumbs() {
  const location = useLocation()
  const pathnames = location.pathname.split("/").filter((x) => x)

  return (
    <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
      <Link to="/" className="hover:text-cyan-500 transition-colors flex items-center gap-1">
        <Home className="h-3 w-3" />
      </Link>
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1
        const to = `/${pathnames.slice(0, index + 1).join("/")}`
        const label = routeMap[value] || value

        return (
          <React.Fragment key={to}>
            <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
            {last ? (
              <span className="text-foreground/90">{label}</span>
            ) : (
              <Link to={to} className="hover:text-cyan-500 transition-colors">
                {label}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
