import * as React from "react"
import { cn } from "@/src/lib/utils"

interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function PageShell({
  title,
  description,
  actions,
  children,
  className,
  ...props
}: PageShellProps) {
  return (
    <div className={cn("p-4 sm:p-6 w-full animate-in fade-in duration-500", className)} {...props}>
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-[#38bdf8] uppercase tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-[#00a896] text-[10px] sm:text-xs font-semibold uppercase tracking-wider opacity-80">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {actions}
          </div>
        )}
      </header>
      
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        {children}
      </div>
    </div>
  )
}
