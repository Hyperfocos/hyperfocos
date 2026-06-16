'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { use } from 'react'

export default function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ next?: string }>
}) {
  const { locale } = use(params)
  const { next: nextParam } = use(searchParams)
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const next = nextParam ?? `/${locale}/dashboard`

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(locale === 'en' ? 'Invalid email or password' : 'E-mail ou senha incorretos')
      setLoading(false)
      return
    }
    router.push(next)
    router.refresh()
  }

  async function handleGoogle() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=${next}`,
      },
    })
  }

  const t = {
    title: locale === 'en' ? 'Welcome back' : 'Bem-vindo de volta',
    subtitle: locale === 'en' ? 'Sign in to continue' : 'Entre para continuar',
    email: locale === 'en' ? 'Email' : 'E-mail',
    password: locale === 'en' ? 'Password' : 'Senha',
    login: locale === 'en' ? 'Sign in' : 'Entrar',
    google: locale === 'en' ? 'Continue with Google' : 'Continuar com Google',
    noAccount: locale === 'en' ? "Don't have an account?" : 'Não tem conta?',
    signup: locale === 'en' ? 'Create account' : 'Criar conta',
    or: locale === 'en' ? 'or' : 'ou',
  }

  return (
    <div className="bg-[#17171c] border border-white/[0.07] rounded-xl p-8">
      <div className="mb-6">
        <h2 className="text-xl font-medium text-white">{t.title}</h2>
        <p className="text-sm text-white/40 mt-1">{t.subtitle}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-white/[0.1] bg-white/[0.04] text-white/80 text-sm font-medium hover:bg-white/[0.08] hover:text-white transition-all disabled:opacity-50 mb-6"
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path d="M17.64 9.2a10.34 10.34 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z" fill="#4285F4"/>
          <path d="M9 18a8.6 8.6 0 0 0 5.96-2.18l-2.92-2.26a5.43 5.43 0 0 1-8.09-2.85H.96v2.33A9 9 0 0 0 9 18z" fill="#34A853"/>
          <path d="M3.95 10.71A5.41 5.41 0 0 1 3.67 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.99-2.33z" fill="#FBBC05"/>
          <path d="M9 3.58a4.86 4.86 0 0 1 3.44 1.35l2.58-2.58A8.64 8.64 0 0 0 9 0 9 9 0 0 0 .96 4.96L3.95 7.3A5.36 5.36 0 0 1 9 3.58z" fill="#EA4335"/>
        </svg>
        {t.google}
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-white/[0.07]" />
        <span className="text-xs text-white/30">{t.or}</span>
        <div className="flex-1 h-px bg-white/[0.07]" />
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">{t.email}</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-[#0e0e11] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors"
            placeholder="voce@email.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">{t.password}</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full bg-[#0e0e11] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors disabled:opacity-50"
        >
          {loading ? '...' : t.login}
        </button>
      </form>

      <p className="text-center text-xs text-white/30 mt-6">
        {t.noAccount}{' '}
        <Link href={`/${locale}/signup`} className="text-violet-400 hover:text-violet-300">
          {t.signup}
        </Link>
      </p>
    </div>
  )
}
