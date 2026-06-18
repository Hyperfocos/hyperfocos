// web/app/(dashboard)/contratos/page.tsx
import { getCurrentUserData } from '@/lib/org/queries'
import { getContratos } from '@/lib/contratos/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { ContratoClient } from '@/lib/contratos/queries'
import { formatDate } from '@/lib/format'

const STATUS_LABELS: Record<string, string> = {
  aguardando_assinatura: 'Aguardando assinatura',
  assinado: 'Assinado',
  distratado: 'Distratado',
}

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  aguardando_assinatura: {
    bg: 'rgba(245,158,11,0.10)',
    color: '#F59E0B',
    border: 'rgba(245,158,11,0.25)',
  },
  assinado: {
    bg: 'rgba(16,185,129,0.10)',
    color: '#10B981',
    border: 'rgba(16,185,129,0.25)',
  },
  distratado: {
    bg: 'rgba(239,68,68,0.10)',
    color: '#EF4444',
    border: 'rgba(239,68,68,0.25)',
  },
}

function ContratoRow({ client }: { client: ContratoClient }) {
  const status = client.contract?.status ?? 'aguardando_assinatura'
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.aguardando_assinatura
  return (
    <Link
      href={`/contratos/${client.id}`}
      className="flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
          {client.name}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
          {client.city ?? '—'}
          {client.contract_date
            ? ` · Contrato: ${formatDate(client.contract_date)}`
            : ''}
        </p>
      </div>
      <span
        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}
      >
        {STATUS_LABELS[status] ?? status}
      </span>
      <span style={{ color: 'rgba(255,255,255,0.25)' }}>→</span>
    </Link>
  )
}

export default async function ContratosPage() {
  const user = await getCurrentUserData()
  if (!user?.membership) redirect('/login')

  const clients = await getContratos()

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>
            Contratos
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {clients.length} clientes aguardando/assinando contrato
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.30)' }}>
              Nenhum cliente neste módulo ainda.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {clients.map((c) => (
              <ContratoRow key={c.id} client={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
