'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Lead } from '@/lib/crm/types'

interface LeadCardProps {
  lead: Lead
  onClick: (lead: Lead) => void
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(lead)}
      className="rounded-xl p-3 cursor-pointer mb-2 transition-all"
    >
      <div
        className="rounded-xl p-3 cursor-pointer"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        onClick={() => onClick(lead)}
      >
        <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
          {lead.name}
        </p>
        {lead.city && (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
            {lead.city}
          </p>
        )}
        {lead.phone && (
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
            {lead.phone}
          </p>
        )}
        {lead.assigned_user && (
          <p className="text-xs mt-1.5" style={{ color: 'rgba(255,200,100,0.60)' }}>
            {lead.assigned_user.full_name ?? lead.assigned_user.email}
          </p>
        )}
      </div>
    </div>
  )
}
