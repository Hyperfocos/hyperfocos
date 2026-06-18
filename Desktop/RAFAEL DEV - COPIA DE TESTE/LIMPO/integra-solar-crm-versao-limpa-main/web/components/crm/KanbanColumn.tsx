'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Lead, FunnelStage } from '@/lib/crm/types'
import { LeadCard } from './LeadCard'

interface KanbanColumnProps {
  stage: FunnelStage
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
}

export function KanbanColumn({ stage, leads, onLeadClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  return (
    <div className="flex flex-col flex-shrink-0 w-64">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: stage.color }}
        />
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {stage.name}
        </span>
        <span
          className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.40)' }}
        >
          {leads.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 rounded-xl p-2 min-h-32 transition-colors"
        style={{
          background: isOver ? 'rgba(255,200,100,0.05)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${isOver ? 'rgba(255,200,100,0.20)' : 'rgba(255,255,255,0.05)'}`,
        }}
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
