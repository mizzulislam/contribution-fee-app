import { Link } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type SidebarNavItemProps = {
  href: string
  label: string
  icon: LucideIcon
  active?: boolean
  collapsed: boolean
}

export function SidebarNavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: SidebarNavItemProps) {
  return (
    <Link
      to={href}
      title={collapsed ? label : undefined}
      className={cn(
        "group relative flex h-11 items-center rounded-xl px-3 text-sm font-medium",
        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        collapsed ? "justify-center" : "justify-start gap-3",
        active
          ? "bg-white/20 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      )}
    >
      {active && (
        <span
          className={cn(
            "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white transition-all duration-300",
            collapsed && "h-5"
          )}
        />
      )}

      <Icon
        className={cn(
          "size-5 shrink-0 transition-all duration-300",
          active ? "text-white" : "text-white/70 group-hover:text-white",
          collapsed ? "scale-105" : "scale-100"
        )}
      />

      <span
        className={cn(
          "overflow-hidden whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          collapsed
            ? "w-0 translate-x-2 opacity-0"
            : "w-[180px] translate-x-0 opacity-100"
        )}
      >
        {label}
      </span>
    </Link>
  )
}
