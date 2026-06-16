'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Task, Profile, EnergyLevel, Category } from '@/types/database'
import { canAddTask } from '@/lib/plans'

type TaskWithActions = Task & { next_actions: { id: string; text: string; completed: boolean }[] }

const CAT_LIMITS: Record<Category, number> = {
  produzir: 3,
  decidir: 3,
  resolver: 5,
  delegar: 999,
}

const ENERGY_FILTER: Record<EnergyLevel, EnergyLevel[]> = {
  high: ['high', 'mid', 'low'],
  mid: ['mid', 'low'],
  low: ['low'],
}

const CAT_COLORS: Record<Category, string> = {
  produzir: '#7c6aff',
  decidir: '#f0a030',
  resolver: '#2dd4a0',
  delegar: '#5ab4ff',
}

const CAT_ENERGY: Record<Category, EnergyLevel> = {
  produzir: 'high',
  decidir: 'mid',
  resolver: 'low',
  delegar: 'low',
}

export default function DashboardClient({
  initialTasks,
  profile,
  userId,
  locale,
  todayEnergy,
}: {
  initialTasks: TaskWithActions[]
  profile: Profile
  userId: string
  locale: string
  todayEnergy: EnergyLevel | null
}) {
  const supabase = createClient()
  const router = useRouter()

  const [tasks, setTasks] = useState<TaskWithActions[]>(initialTasks)
  const [energy, setEnergy] = useState<EnergyLevel | null>(todayEnergy)
  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'progress'>('today')
  const [focusTask, setFocusTask] = useState<TaskWithActions | null>(null)
  const [timerSeconds, setTimerSeconds] = useState(600)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerDone, setTimerDone] = useState(false)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [captureText, setCaptureText] = useState('')
  const [detailTask, setDetailTask] = useState<TaskWithActions | null>(null)
  const [addingIn, setAddingIn] = useState<Category | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [focusSessions, setFocusSessions] = useState(0)
  const [energyMenuOpen, setEnergyMenuOpen] = useState(false)

  const t = {
    catName: locale === 'en'
      ? { produzir: 'Create', decidir: 'Decide', resolver: 'Resolve', delegar: 'Delegate' }
      : { produzir: 'Produzir', decidir: 'Decidir', resolver: 'Resolver', delegar: 'Delegar' },
    energyTitle: locale === 'en' ? "How's your energy?" : 'Como está sua energia?',
    mission: locale === 'en' ? 'Mission of the day' : 'Missão do dia',
    startNow: locale === 'en' ? 'Start now →' : 'Iniciar agora →',
    today: locale === 'en' ? 'Today' : 'Hoje',
    progress: locale === 'en' ? 'Progress' : 'Progresso',
    allTasks: locale === 'en' ? 'All tasks' : 'Todas as tarefas',
    allTasksTitle: locale === 'en' ? 'All quadrants' : 'Todos os quadrantes',
    allTasksSubtitle: locale === 'en'
      ? 'Viewing every task, regardless of today’s energy.'
      : 'Visualizando todas as tarefas, sem filtro de energia.',
    changeEnergy: locale === 'en' ? 'Change energy' : 'Alterar energia',
    startFocus: locale === 'en' ? '🎯 Start focus' : '🎯 Iniciar foco',
    complete: locale === 'en' ? '✓ Complete' : '✓ Concluir',
    delete: locale === 'en' ? 'Delete' : 'Excluir',
    close: locale === 'en' ? 'Close' : 'Fechar',
    nextAction: locale === 'en' ? '⚡ Next physical action' : '⚡ Próxima ação física',
    captureTitle: locale === 'en' ? 'Clear your head' : 'Despeje tudo da sua cabeça',
    captureSubtitle: locale === 'en'
      ? 'Write anything — tasks, worries, ideas.'
      : 'Escreva qualquer coisa — tarefas, preocupações, ideias.',
    organize: locale === 'en' ? 'Organize with AI ✦' : 'Organizar com IA ✦',
    energyLabels: locale === 'en'
      ? { high: '⚡ High', mid: '☕ Medium', low: '🌙 Low' }
      : { high: '⚡ Alta', mid: '☕ Média', low: '🌙 Baixa' },
    logout: locale === 'en' ? 'Sign out' : 'Sair',
    planLabel: locale === 'en' ? `Plan: ${profile.plan}` : `Plano: ${profile.plan}`,
  }

  // Timer
  useEffect(() => {
    if (!timerRunning) return
    const interval = setInterval(() => {
      setTimerSeconds(s => {
        if (s <= 1) {
          clearInterval(interval)
          setTimerRunning(false)
          setTimerDone(true)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timerRunning])

  // Realtime tasks
  useEffect(() => {
    const channel = supabase
      .channel('tasks')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${userId}`,
      }, () => {
        router.refresh()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, userId, router])

  const getTasksForCategory = useCallback((cat: Category, includeAllEnergy = false): TaskWithActions[] => {
    const categoryTasks = tasks.filter(t => t.category === cat && t.status !== 'done')
    const visibleTasks = includeAllEnergy || !energy
      ? categoryTasks
      : categoryTasks.filter(t => ENERGY_FILTER[energy].includes(t.energy_level))

    return visibleTasks
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority
        return b.created_at.localeCompare(a.created_at)
      })
      .slice(0, CAT_LIMITS[cat])
  }, [tasks, energy])

  const getMission = useCallback((): TaskWithActions | null => {
    if (!energy) return null
    const cats: Category[] = ['produzir', 'decidir', 'resolver', 'delegar']
    for (const cat of cats) {
      const filtered = getTasksForCategory(cat)
      if (filtered.length > 0) return filtered[0]
    }
    return null
  }, [getTasksForCategory, energy])

  async function saveEnergy(level: EnergyLevel) {
    setEnergy(level)
    await supabase.from('energy_checkins').insert({ user_id: userId, level })
  }

  async function completeTask(task: TaskWithActions) {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'done' } : t))
    await supabase.from('tasks').update({
      status: 'done',
      completed_at: new Date().toISOString(),
    }).eq('id', task.id)
  }

  async function deleteTask(task: TaskWithActions) {
    setTasks(prev => prev.filter(t => t.id !== task.id))
    await supabase.from('tasks').delete().eq('id', task.id)
  }

  async function addTask(cat: Category) {
    const title = newTaskTitle.trim()
    if (!title) return

    const currentActive = tasks.filter(t => t.status !== 'done').length
    if (!canAddTask(profile.plan, currentActive)) {
      alert(locale === 'en'
        ? 'Task limit reached. Upgrade to Pro for unlimited tasks.'
        : 'Limite de tarefas atingido. Faça upgrade para Pro.')
      return
    }

    const newTask = {
      user_id: userId,
      title,
      category: cat,
      energy_level: CAT_ENERGY[cat],
      status: 'pending' as const,
      estimated_minutes: cat === 'resolver' ? 5 : 30,
      priority: 99,
      is_mission_today: false,
    }

    const { data } = await supabase.from('tasks').insert(newTask).select('*, next_actions(*)').single()
    if (data) setTasks(prev => [...prev, data as TaskWithActions])

    setNewTaskTitle('')
    setAddingIn(null)
  }

  function startFocus(task: TaskWithActions) {
    setDetailTask(null)
    setFocusTask(task)
    setTimerSeconds(600)
    setTimerRunning(true)
    setTimerDone(false)
  }

  async function focusOutcome(outcome: 'done' | 'continue' | 'snooze') {
    if (!focusTask) return

    setFocusSessions(s => s + 1)
    await supabase.from('focus_sessions').insert({
      user_id: userId,
      task_id: focusTask.id,
      duration_minutes: Math.round((600 - timerSeconds) / 60) || 10,
      outcome,
      ended_at: new Date().toISOString(),
    })

    if (outcome === 'done') {
      await completeTask(focusTask)
      setFocusTask(null)
    } else if (outcome === 'continue') {
      setTimerSeconds(600)
      setTimerRunning(true)
      setTimerDone(false)
    } else {
      setFocusTask(null)
    }
  }

  async function handleCapture() {
    if (!captureText.trim()) return
    // Classificação simples (semana 3 será IA real)
    const items = captureText.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean)
    for (const title of items) {
      const t = title.toLowerCase()
      let cat: Category = 'produzir'
      if (t.match(/responder|ligar|confirmar|assinar|avisar/)) cat = 'resolver'
      else if (t.match(/decidir|escolher|aprovar|definir/)) cat = 'decidir'
      else if (t.match(/delegar|solicitar|cobrar|acionar/)) cat = 'delegar'

      const { data } = await supabase.from('tasks').insert({
        user_id: userId,
        title,
        category: cat,
        energy_level: CAT_ENERGY[cat],
        status: 'pending',
        estimated_minutes: cat === 'resolver' ? 5 : 30,
        priority: 99,
        is_mission_today: false,
      }).select('*, next_actions(*)').single()

      if (data) setTasks(prev => [...prev, data as TaskWithActions])
    }
    setCaptureText('')
    setCaptureOpen(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push(`/${locale}/login`)
  }

  const mission = getMission()
  const doneTasks = tasks.filter(t => t.status === 'done').length
  const timerMin = Math.floor(timerSeconds / 60)
  const timerSec = timerSeconds % 60
  const timerDisplay = `${timerMin}:${timerSec.toString().padStart(2, '0')}`
  const ringProgress = timerSeconds / 600
  const circumference = 314

  // ─── CHECK-IN SCREEN ─────────────────────────────────────────
  if (!energy) {
    return (
      <div className="min-h-screen bg-[#0e0e11] flex flex-col items-center justify-center gap-10 p-6">
        <div className="text-center">
          <div className="text-xs font-semibold tracking-widest text-white/30 uppercase mb-2">HyperFoco</div>
          <h1 className="text-3xl font-light text-white tracking-tight">
            {t.energyTitle}
          </h1>
        </div>
        <div className="flex gap-4 flex-wrap justify-center">
          {(['high', 'mid', 'low'] as EnergyLevel[]).map(level => (
            <button
              key={level}
              onClick={() => saveEnergy(level)}
              className="flex flex-col items-center gap-3 px-8 py-7 bg-[#17171c] border border-white/[0.07] rounded-xl cursor-pointer hover:border-white/20 hover:-translate-y-0.5 transition-all min-w-[140px]"
            >
              <span className="text-3xl">{level === 'high' ? '⚡' : level === 'mid' ? '☕' : '🌙'}</span>
              <span className="text-sm font-medium text-white">{t.energyLabels[level]}</span>
            </button>
          ))}
        </div>
        <button onClick={() => saveEnergy('mid')} className="text-xs text-white/25 underline">
          {locale === 'en' ? 'Skip for now' : 'Pular por hoje'}
        </button>
      </div>
    )
  }

  // ─── FOCUS OVERLAY ───────────────────────────────────────────
  if (focusTask) {
    return (
      <div className="min-h-screen bg-[#0e0e11] flex flex-col items-center justify-center gap-8 p-6">
        <button
          onClick={() => setFocusTask(null)}
          className="fixed top-5 right-5 text-white/30 hover:text-white text-xl bg-none border-none cursor-pointer"
        >✕</button>
        <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: CAT_COLORS[focusTask.category] }}>
          {t.catName[focusTask.category]}
        </div>
        <h2 className="text-3xl font-light text-white tracking-tight text-center max-w-lg leading-tight">
          {focusTask.title}
        </h2>
        <div className="bg-[#17171c] border border-white/[0.07] rounded-xl p-5 max-w-sm w-full">
          <div className="text-xs font-semibold tracking-widest uppercase text-emerald-400 mb-2">⚡ {t.nextAction}</div>
          <div className="text-sm text-white/80">
            {focusTask.next_actions?.[0]?.text ?? `${locale === 'en' ? 'Start: ' : 'Iniciar: '}${focusTask.title}`}
          </div>
        </div>
        <div className="relative w-28 h-28">
          <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
            <circle cx="56" cy="56" r="48" fill="none" stroke="#1f1f27" strokeWidth="6"/>
            <circle cx="56" cy="56" r="48" fill="none" stroke="#7c6aff" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={`${circumference * (1 - ringProgress)}`}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-light text-white font-mono tracking-tight">{timerDisplay}</span>
            <span className="text-[10px] text-white/30 mt-0.5">{t.today}</span>
          </div>
        </div>

        {!timerDone ? (
          <button
            onClick={() => setTimerRunning(r => !r)}
            className="px-5 py-2.5 rounded-lg border border-white/[0.1] bg-[#17171c] text-white/80 text-sm font-medium hover:bg-[#1f1f27] transition-all"
          >
            {timerRunning
              ? (locale === 'en' ? '⏸ Pause' : '⏸ Pausar')
              : (locale === 'en' ? '▶ Resume' : '▶ Retomar')}
          </button>
        ) : (
          <div className="flex gap-3 flex-wrap justify-center">
            <button onClick={() => focusOutcome('continue')} className="px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-all">
              {locale === 'en' ? 'Continue (+10min)' : 'Continuar (+10min)'}
            </button>
            <button onClick={() => focusOutcome('done')} className="px-5 py-2.5 rounded-lg border border-white/[0.1] bg-[#17171c] text-emerald-400 text-sm font-medium hover:bg-[#1f1f27] transition-all">
              {locale === 'en' ? 'Complete ✓' : 'Concluir ✓'}
            </button>
            <button onClick={() => focusOutcome('snooze')} className="px-5 py-2.5 rounded-lg border border-white/[0.1] bg-[#17171c] text-white/30 text-sm font-medium hover:bg-[#1f1f27] transition-all">
              {locale === 'en' ? 'Snooze' : 'Adiar'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ─── MAIN APP ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0e0e11]">
      {/* Topbar */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-3.5 border-b border-white/[0.06] bg-[#0e0e11]">
        <div className="text-[15px] font-semibold text-white tracking-tight">
          Hyper<span className="text-violet-400">Foco</span>
        </div>
        <div className="relative flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEnergyMenuOpen(open => !open)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#17171c] border border-white/[0.07] text-xs text-white/50 hover:text-white/80 hover:border-white/15 transition-all"
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: energy === 'high' ? '#2dd4a0' : energy === 'mid' ? '#f0a030' : '#55556a' }}
            />
            {t.energyLabels[energy]}
            <span className="text-[10px] text-white/25">▾</span>
          </button>
          {energyMenuOpen && (
            <div className="absolute right-0 top-10 z-20 w-56 rounded-xl border border-white/[0.08] bg-[#17171c] shadow-2xl shadow-black/40 p-2">
              <div className="px-2 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/25">
                {t.changeEnergy}
              </div>
              {(['high', 'mid', 'low'] as EnergyLevel[]).map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={async () => {
                    await saveEnergy(level)
                    setEnergyMenuOpen(false)
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    energy === level ? 'bg-white/[0.06] text-white' : 'text-white/70 hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="text-base">{level === 'high' ? '⚡' : level === 'mid' ? '☕' : '🌙'}</span>
                  <span className="flex-1">{t.energyLabels[level]}</span>
                  {energy === level && <span className="text-[10px] text-violet-400">●</span>}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            {t.logout}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6">
          {(['today', 'all', 'progress'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-[#1f1f27] text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab === 'today' ? t.today : tab === 'all' ? t.allTasks : t.progress}
            </button>
          ))}
        </div>

        {activeTab === 'today' && (
          <>
            {/* Missão do dia */}
            <div className="text-[11px] font-semibold tracking-widest uppercase text-white/30 mb-3">{t.mission}</div>
            {mission ? (
              <div
                onClick={() => setDetailTask(mission)}
                className="relative bg-violet-950/30 border border-violet-500/20 rounded-xl p-5 mb-7 cursor-pointer hover:border-violet-500/40 transition-all overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-violet-500 rounded-l-xl" />
                <div className="text-[11px] font-semibold uppercase tracking-wider text-violet-400 mb-2">🎯 {t.mission}</div>
                <div className="text-lg font-medium text-white leading-snug mb-2">{mission.title}</div>
                <div className="text-xs text-white/40">{t.catName[mission.category]} · {mission.estimated_minutes}min</div>
                <div className="text-sm font-medium text-violet-400 mt-3">{t.startNow}</div>
              </div>
            ) : (
              <div className="bg-[#17171c] border border-white/[0.06] rounded-xl p-5 mb-7 text-center text-white/30 text-sm">
                🎉 {locale === 'en' ? 'All clear! Add new tasks below.' : 'Tudo limpo! Adicione novas tarefas.'}
              </div>
            )}

            {/* Quadrantes */}
            <div className="grid grid-cols-2 gap-4">
              {(['produzir', 'decidir', 'resolver', 'delegar'] as Category[]).map(cat => {
                const catTasks = getTasksForCategory(cat)
                return (
                  <div key={cat} className="bg-[#17171c] border border-white/[0.06] rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: CAT_COLORS[cat] }}/>
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: CAT_COLORS[cat] }}>
                          {t.catName[cat]}
                        </span>
                      </div>
                      <span className="text-xs text-white/25 font-mono">
                        {cat === 'delegar' ? catTasks.length : `${catTasks.length}/${CAT_LIMITS[cat]}`}
                      </span>
                    </div>
                    <div>
                      {catTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => setDetailTask(task)}
                          className="group flex items-start gap-2.5 px-4 py-2.5 hover:bg-white/[0.03] cursor-pointer transition-colors"
                        >
                          <div className="w-3.5 h-3.5 rounded border border-white/20 flex-shrink-0 mt-0.5 group-hover:border-violet-400 transition-colors"/>
                          <span className="text-xs text-white/70 flex-1 leading-snug">{task.title}</span>
                          <button
                            onClick={e => { e.stopPropagation(); deleteTask(task) }}
                            className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-red-400 text-xs transition-all flex-shrink-0"
                          >✕</button>
                        </div>
                      ))}
                      {addingIn === cat ? (
                        <div className="px-4 pb-3 pt-1">
                          <input
                            autoFocus
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') addTask(cat); if (e.key === 'Escape') setAddingIn(null) }}
                            placeholder={locale === 'en' ? 'New task...' : 'Nova tarefa...'}
                            className="w-full bg-[#0e0e11] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/20 outline-none focus:border-violet-500/50"
                          />
                          <div className="flex gap-1.5 mt-1.5">
                            <button onClick={() => addTask(cat)} className="text-xs px-2.5 py-1 rounded bg-violet-600 text-white">
                              {locale === 'en' ? 'Add' : 'Adicionar'}
                            </button>
                            <button onClick={() => setAddingIn(null)} className="text-xs px-2.5 py-1 rounded border border-white/[0.08] text-white/40">
                              {locale === 'en' ? 'Cancel' : 'Cancelar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingIn(cat)}
                          className="w-full text-left px-4 py-2 text-xs text-white/25 hover:text-white/50 transition-colors"
                        >
                          + {locale === 'en' ? 'Add task' : 'Adicionar tarefa'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {activeTab === 'all' && (
          <>
            <div className="mb-3">
              <div className="text-[11px] font-semibold tracking-widest uppercase text-white/30 mb-2">{t.allTasksTitle}</div>
              <div className="bg-[#17171c] border border-white/[0.06] rounded-xl p-4 text-sm text-white/45">
                {t.allTasksSubtitle}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(['produzir', 'decidir', 'resolver', 'delegar'] as Category[]).map(cat => {
                const catTasks = getTasksForCategory(cat, true)
                return (
                  <div key={cat} className="bg-[#17171c] border border-white/[0.06] rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: CAT_COLORS[cat] }}/>
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: CAT_COLORS[cat] }}>
                          {t.catName[cat]}
                        </span>
                      </div>
                      <span className="text-xs text-white/25 font-mono">
                        {cat === 'delegar' ? catTasks.length : `${catTasks.length}/${CAT_LIMITS[cat]}`}
                      </span>
                    </div>
                    <div>
                      {catTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => setDetailTask(task)}
                          className="group flex items-start gap-2.5 px-4 py-2.5 hover:bg-white/[0.03] cursor-pointer transition-colors"
                        >
                          <div className="w-3.5 h-3.5 rounded border border-white/20 flex-shrink-0 mt-0.5 group-hover:border-violet-400 transition-colors"/>
                          <span className="text-xs text-white/70 flex-1 leading-snug">{task.title}</span>
                          <button
                            onClick={e => { e.stopPropagation(); deleteTask(task) }}
                            className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-red-400 text-xs transition-all flex-shrink-0"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {activeTab === 'progress' && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: locale === 'en' ? 'Done today' : 'Concluídas hoje', value: doneTasks },
                { label: locale === 'en' ? 'Focus sessions' : 'Sessões de foco', value: focusSessions },
                { label: locale === 'en' ? 'Delegated' : 'Delegadas', value: getFilteredTasks('delegar').length },
                { label: locale === 'en' ? 'Active tasks' : 'Tarefas ativas', value: tasks.filter(t => t.status !== 'done').length },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#17171c] border border-white/[0.06] rounded-xl p-4">
                  <div className="text-xs text-white/40 mb-2">{label}</div>
                  <div className="text-2xl font-light text-white font-mono">{value}</div>
                </div>
              ))}
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3">
              {locale === 'en' ? 'Plan' : 'Plano'}
            </div>
            <div className="bg-[#17171c] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white capitalize">{profile.plan}</div>
                <div className="text-xs text-white/40 mt-0.5">{t.planLabel}</div>
              </div>
              {profile.plan === 'basic' && (
                <a href={`/${locale}/pricing`} className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-500 transition-colors">
                  {locale === 'en' ? 'Upgrade to Pro' : 'Fazer upgrade'}
                </a>
              )}
            </div>
          </>
        )}
      </main>

      {/* Floating capture button */}
      <button
        onClick={() => setCaptureOpen(true)}
        className="fixed bottom-6 right-6 w-13 h-13 rounded-full bg-violet-600 text-white text-2xl flex items-center justify-center shadow-lg shadow-violet-900/40 hover:bg-violet-500 hover:scale-105 transition-all z-20 w-12 h-12"
      >+</button>

      {/* Capture modal */}
      {captureOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-end justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setCaptureOpen(false) }}
        >
          <div className="bg-[#17171c] border border-white/[0.1] rounded-xl p-6 w-full max-w-lg animate-in slide-in-from-bottom-4 duration-200">
            <h3 className="text-base font-medium text-white mb-1">{t.captureTitle}</h3>
            <p className="text-xs text-white/40 mb-4">{t.captureSubtitle}</p>
            <textarea
              autoFocus
              value={captureText}
              onChange={e => setCaptureText(e.target.value)}
              placeholder={locale === 'en' ? 'Ex: call the bank, reply to John, decide on supplier...' : 'Ex: ligar pro banco, responder o João, decidir fornecedor...'}
              className="w-full bg-[#0e0e11] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 min-h-[90px] resize-none"
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-white/25">{locale === 'en' ? 'AI will classify automatically' : 'A IA vai classificar automaticamente'}</span>
              <div className="flex gap-2">
                <button onClick={() => setCaptureOpen(false)} className="text-xs px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/40 hover:text-white/60 transition-colors">
                  {locale === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
                <button onClick={handleCapture} className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-500 transition-colors">
                  {t.organize}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {energyMenuOpen && (
        <button
          type="button"
          aria-label="Close energy menu"
          className="fixed inset-0 z-10 cursor-default"
          onClick={() => setEnergyMenuOpen(false)}
        />
      )}

      {/* Task detail modal */}
      {detailTask && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setDetailTask(null) }}
        >
          <div className="bg-[#17171c] border border-white/[0.1] rounded-xl p-7 w-full max-w-md animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: CAT_COLORS[detailTask.category] }}>
                {t.catName[detailTask.category]}
              </span>
              <button onClick={() => setDetailTask(null)} className="text-white/30 hover:text-white text-lg transition-colors">✕</button>
            </div>
            <h3 className="text-xl font-light text-white leading-snug tracking-tight mb-5">{detailTask.title}</h3>
            <div className="bg-[#0e0e11] rounded-lg p-4 mb-5">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400 mb-2">{t.nextAction}</div>
              <div className="text-sm text-white/80">
                {detailTask.next_actions?.[0]?.text ?? `${locale === 'en' ? 'Start: ' : 'Iniciar: '}${detailTask.title}`}
              </div>
            </div>
            <div className="flex gap-3 text-xs text-white/40 mb-5">
              <span>⏱ {detailTask.estimated_minutes}min</span>
              <span>🔋 {detailTask.energy_level}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => startFocus(detailTask)}
                className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors"
              >{t.startFocus}</button>
              <button
                onClick={() => { completeTask(detailTask); setDetailTask(null) }}
                className="px-4 py-2 rounded-lg border border-white/[0.08] text-white/70 text-sm hover:bg-white/[0.04] transition-colors"
              >{t.complete}</button>
              <button
                onClick={() => setDetailTask(null)}
                className="px-4 py-2 rounded-lg border border-white/[0.08] text-white/40 text-sm hover:bg-white/[0.04] transition-colors"
              >{t.close}</button>
              <button
                onClick={() => { deleteTask(detailTask); setDetailTask(null) }}
                className="px-4 py-2 rounded-lg border border-red-500/20 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
              >{t.delete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
