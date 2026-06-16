import type { Plan } from '@/types/database'

export const PLAN_LIMITS: Record<Plan, {
  maxActiveTasks: number
  aiCapturePerDay: number
  hasFullDashboard: boolean
  hasEnglish: boolean
}> = {
  basic: {
    maxActiveTasks: 20,
    aiCapturePerDay: 5,
    hasFullDashboard: false,
    hasEnglish: false,
  },
  pro: {
    maxActiveTasks: Infinity,
    aiCapturePerDay: Infinity,
    hasFullDashboard: true,
    hasEnglish: true,
  },
}

export const PLAN_PRICES = {
  basic: { yearly: 2900, label: 'Basic', labelEn: 'Basic' },   // R$ 29,00/ano em centavos
  pro:   { yearly: 7900, label: 'Pro',   labelEn: 'Pro' },     // R$ 79,00/ano em centavos
}

export function getPlanLimits(plan: Plan) {
  return PLAN_LIMITS[plan]
}

export function canAddTask(plan: Plan, currentCount: number): boolean {
  return currentCount < PLAN_LIMITS[plan].maxActiveTasks
}

export function canUseAiCapture(plan: Plan, usageToday: number): boolean {
  return usageToday < PLAN_LIMITS[plan].aiCapturePerDay
}
