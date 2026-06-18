'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/auth/actions'
import type { CurrentUserData } from '@/lib/org/queries'

type NavItem = {
  label: string
  href: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: '▣' },
  { label: 'CRM / Leads', href: '/leads', icon: '⟳' },
  { label: 'Clientes', href: '/clientes', icon: '👤' },
  { label: 'Propostas', href: '/propostas', icon: '📄' },
  { label: 'Contratos', href: '/contratos', icon: '📋' },
  { label: 'Financeiro', href: '/financeiro', icon: '💰' },
  { label: 'Projetos', href: '/projetos', icon: '📐' },
  { label: 'Compras', href: '/compras', icon: '🛒' },
  { label: 'Obras', href: '/obras', icon: '🔧' },
  { label: 'Configurações', href: '/configuracoes', icon: '⚙' },
]

interface SidebarProps {
  user: CurrentUserData
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const initials = (user.profile.full_name ?? user.profile.email)
    .substring(0, 2)
    .toUpperCase()

  const roleLabel: Record<string, string> = {
    owner: 'Proprietário',
    admin: 'Administrador',
    manager: 'Gerente',
    user: 'Usuário',
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-[#0E2236] flex flex-col z-50">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-white/[0.06]">
        <div className="w-7 h-7 rounded-lg bg-[#4AABDB] flex items-center justify-center text-white text-xs font-black">
          IS
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[12.5px] font-extrabold text-white tracking-[0.3px]">
            Integra <span className="text-[#4AABDB]">Solar</span>
          </span>
          <span className="text-[8px] font-semibold text-white/30 uppercase tracking-[0.12em]">
            CRM
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-1.5 px-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-[12.5px] font-medium my-0.5 transition-all ${
                isActive
                  ? 'bg-[#4AABDB]/15 text-white border-l-2 border-[#4AABDB]'
                  : 'text-white/55 hover:bg-white/[0.06] hover:text-white/85'
              }`}
            >
              <span className="w-4 text-center text-sm flex-shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User area */}
      <div className="p-2.5 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 p-2 rounded-md bg-white/[0.05]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4AABDB] to-[#1A3A5C] flex items-center justify-center text-[11px] font-black text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-white truncate">
              {user.profile.full_name ?? user.profile.email.split('@')[0]}
            </p>
            <p className="text-[10px] text-white/30">
              {user.membership ? roleLabel[user.membership.role] : ''}
            </p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              title="Sair"
              className="text-white/25 hover:text-red-400 transition-colors p-1 rounded"
            >
              ↩
            </button>
          </form>
        </div>

        {user.membership && (
          <p className="mt-1.5 text-[10px] text-white/20 text-center truncate px-1">
            {user.membership.organization.name}
          </p>
        )}
      </div>
    </aside>
  )
}
