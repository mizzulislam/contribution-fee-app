import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { cn } from "@/lib/utils"

type SidebarToggleProps = {
  collapsed: boolean
  onClick: () => void
  className?: string
}

export function SidebarToggle({ collapsed, onClick, className }: SidebarToggleProps) {
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
      className={cn(
        "group inline-flex size-8 items-center justify-center rounded-lg",
        "border border-white/10 bg-white/[0.06] text-white/75 backdrop-blur-xl",
        "transition-all duration-300 hover:bg-white/[0.1] hover:text-white hover:shadow-[0_0_24px_rgba(16,185,129,0.16)]",
        "focus:outline-none focus:ring-2 focus:ring-emerald-300/50",
        className
      )}
    >
      <Icon className="size-4 transition-transform duration-300 group-hover:scale-110" />
    </button>
  )
}
