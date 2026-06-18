// web/components/crm/LeadsTable.tsx
'use client'

import type { Lead } from '@/lib/crm/types'
import { formatPhone, formatDate } from '@/lib/format'

interface LeadsTableProps {
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
}

export function LeadsTable({ leads, onLeadClick }: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.30)' }}>
          Nenhum lead cadastrado ainda.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-auto h-full px-6 py-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {['Nome', 'Telefone', 'Cidade', 'Etapa', 'Responsável', 'Criado em'].map((h) => (
              <th
                key={h}
                className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              onClick={() => onLeadClick(lead)}
              className="cursor-pointer transition-colors"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLTableRowElement).style.background =
                  'rgba(255,255,255,0.03)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLTableRowElement).style.background = 'transparent'
              }}
            >
              <td className="py-2.5 px-3 font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {lead.name}
              </td>
              <td className="py-2.5 px-3" style={{ color: 'rgba(255,255,255,0.50)' }}>
                {formatPhone(lead.phone)}
              </td>
              <td className="py-2.5 px-3" style={{ color: 'rgba(255,255,255,0.50)' }}>
                {lead.city ?? '—'}
              </td>
              <td className="py-2.5 px-3">
                {lead.stage ? (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      background: `${lead.stage.color}25`,
                      color: lead.stage.color,
                      border: `1px solid ${lead.stage.color}40`,
                    }}
                  >
                    {lead.stage.name}
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td className="py-2.5 px-3" style={{ color: 'rgba(255,255,255,0.50)' }}>
                {lead.assigned_user?.full_name ?? lead.assigned_user?.email ?? '—'}
              </td>
              <td className="py-2.5 px-3 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {formatDate(lead.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
