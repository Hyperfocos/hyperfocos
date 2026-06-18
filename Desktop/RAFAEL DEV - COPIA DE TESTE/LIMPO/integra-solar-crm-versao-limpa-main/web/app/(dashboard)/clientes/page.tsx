// web/app/(dashboard)/clientes/page.tsx
import { getCurrentUserData } from '@/lib/org/queries'
import { getClients } from '@/lib/clients/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Client } from '@/lib/clients/types'

function ClientRow({ client }: { client: Client }) {
  const tabsDone = Object.values(client.completed_tabs).filter(Boolean).length
  return (
    <Link
      href={`/clientes/${client.id}`}
      className="flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all cursor-pointer"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
          {client.name}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.40)' }}>
          {client.city ?? ''}{client.city && client.phone ? ' · ' : ''}{client.phone ?? ''}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>
          {tabsDone}/8 abas
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            background: 'rgba(16,185,129,0.12)',
            color: '#10B981',
            border: '1px solid rgba(16,185,129,0.25)',
          }}
        >
          {client.pipeline_stage}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.25)' }}>→</span>
      </div>
    </Link>
  )
}

export default async function ClientesPage() {
  const user = await getCurrentUserData()
  if (!user?.membership) redirect('/login')

  const clients = await getClients()

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>
            Clientes
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {clients.length} clientes com cadastro completo
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.30)' }}>
              Nenhum cliente com cadastro completo ainda.
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.20)' }}>
              Converta um lead em cliente e preencha as 6 primeiras abas.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {clients.map((client) => (
              <ClientRow key={client.id} client={client} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
