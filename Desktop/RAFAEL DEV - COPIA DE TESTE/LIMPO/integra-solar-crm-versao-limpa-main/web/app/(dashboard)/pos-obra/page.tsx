// web/app/(dashboard)/pos-obra/page.tsx
import Link from 'next/link'
import { getPosObras } from '@/lib/pos-obra/queries'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pendente: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    concluida: 'bg-green-500/20 text-green-300 border-green-500/40',
  }
  const labels: Record<string, string> = { pendente: 'Pendente', concluida: 'Concluída' }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border ${map[status] ?? 'bg-gray-500/20 text-gray-300 border-gray-500/40'}`}>
      {labels[status] ?? status}
    </span>
  )
}

export default async function PosObraPage() {
  const posObras = await getPosObras()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pós-Obra</h1>
        <p className="text-white/50 text-sm mt-1">Acompanhamento de satisfação e pós-venda</p>
      </div>
      <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/50">
              <th className="text-left px-4 py-3 font-medium">Cliente</th>
              <th className="text-left px-4 py-3 font-medium">Cidade</th>
              <th className="text-left px-4 py-3 font-medium">Prazo</th>
              <th className="text-left px-4 py-3 font-medium">NPS</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {posObras.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/40">
                  Nenhum pós-obra pendente.
                </td>
              </tr>
            )}
            {posObras.map((e) => (
              <tr key={e.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-white font-medium">{e.client_name}</td>
                <td className="px-4 py-3 text-white/60">{e.client_city ?? '—'}</td>
                <td className="px-4 py-3 text-white/60">
                  {e.contract_max_days ? `${e.dias_usados} / ${e.contract_max_days} dias` : `${e.dias_usados} dias`}
                </td>
                <td className="px-4 py-3 text-white/60">{e.nps ?? '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/pos-obra/${e.client_id}`}
                    className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                    style={{ borderColor: 'rgba(255,208,128,0.4)', color: '#FFD080' }}
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
