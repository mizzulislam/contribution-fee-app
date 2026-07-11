import { LayoutDashboard, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { cn } from "@/utils/styles"

type SidebarLogoProps = {
  collapsed: boolean
  onClick?: () => void
}

export function SidebarLogo({ collapsed, onClick }: SidebarLogoProps) {
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <div
      className={cn(
        "flex h-16 items-center border-b border-white/10 px-4 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        collapsed ? "justify-center" : "justify-start gap-3"
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl",
          "bg-white/20 text-white ring-1 ring-white/40 shadow-lg focus:outline-none focus:ring-white/60",
          "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-white/30",
          collapsed && "scale-95 rounded-lg"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none" />
        
        <LayoutDashboard
          className={cn(
            "absolute z-10 size-5 transition-all duration-300",
            collapsed ? "rotate-0 scale-110" : "scale-100",
            "opacity-100 group-hover:opacity-0 group-hover:scale-50"
          )}
        />
        
        <ToggleIcon
          className={cn(
            "absolute z-10 size-5 transition-all duration-300 text-white",
            "opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-110"
          )}
        />
      </button>

      <div
        className={cn(
          "grid overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          collapsed
            ? "w-0 translate-x-2 opacity-0"
            : "w-[170px] translate-x-0 opacity-100"
        )}
      >
        <span className="truncate text-lg font-bold tracking-tight text-white">
          Splitz
        </span>
        <span className="truncate text-[10px] uppercase tracking-wider font-semibold text-white/70">
          Iuran & Split Bill
        </span>
      </div>
    </div>
  )
}
