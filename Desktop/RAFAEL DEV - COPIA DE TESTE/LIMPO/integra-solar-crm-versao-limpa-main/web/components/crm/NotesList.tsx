'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { createNote, deleteNote } from '@/lib/crm/actions'
import type { Lead, LeadNote } from '@/lib/crm/types'

export function NotesList({ lead }: { lead: Lead }) {
  const [notes, setNotes] = useState<LeadNote[]>(lead.notes)
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setNotes(lead.notes)
  }, [lead.notes])

  function refreshNotes() {
    fetch(`/api/leads/${lead.id}/notes`)
      .then((r) => r.json())
      .then((data) => { if (data.notes) setNotes(data.notes) })
  }

  function handleAdd() {
    if (!content.trim()) return
    startTransition(async () => {
      await createNote(lead.id, content)
      setContent('')
      refreshNotes()
    })
  }

  function handleDelete(noteId: string) {
    startTransition(async () => {
      await deleteNote(noteId)
      refreshNotes()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nova anotação..."
          rows={3}
          className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
            color: '#E0E8F0',
          }}
        />
        <Button
          className="self-end text-xs py-1.5 px-4"
          onClick={handleAdd}
          loading={isPending}
          disabled={!content.trim()}
        >
          Adicionar nota
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {notes.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Nenhuma anotação ainda.
          </p>
        )}
        {notes.map((note) => (
          <div
            key={note.id}
            className="rounded-xl p-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.80)' }}>{note.content}</p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>
                {note.author?.full_name ?? 'Usuário'} · {new Date(note.created_at).toLocaleString('pt-BR')}
              </p>
              <button
                onClick={() => handleDelete(note.id)}
                disabled={isPending}
                className="text-xs transition-colors"
                style={{ color: 'rgba(255,80,80,0.50)' }}
              >
                excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
