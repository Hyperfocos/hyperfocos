'use client'

import Image from 'next/image'
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
    <aside
      className="fixed left-0 top-0 bottom-0 w-56 flex flex-col z-50"
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div
        className="h-14 flex items-center gap-2.5 px-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Image
          src="/Logo integra solar - sem nome.png"
          alt="Integra Solar"
          width={36}
          height={36}
          className="object-contain"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium my-0.5 transition-all"
              style={
                isActive
                  ? {
                      color: '#FFD080',
                      background: 'rgba(255,200,100,0.08)',
                      fontWeight: 600,
                    }
                  : undefined
              }
            >
              <span
                className="w-4 text-center text-sm flex-shrink-0"
                style={{ color: isActive ? '#FFD080' : 'rgba(255,255,255,0.4)' }}
              >
                {item.icon}
              </span>
              <span style={{ color: isActive ? '#FFD080' : 'rgba(255,255,255,0.4)' }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* User area */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div
          className="flex items-center gap-2 p-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black text-[#1A1A1A] flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #FFD080, #FF9F40)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white truncate">
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
              className="transition-colors p-1 rounded text-white/25 hover:text-red-400"
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
