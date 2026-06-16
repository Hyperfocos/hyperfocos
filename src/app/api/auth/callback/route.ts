import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/pt-BR/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Criar profile se não existir
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? null,
          plan: 'basic',
          plan_status: 'active',
          locale: 'pt-BR',
        }, { onConflict: 'id', ignoreDuplicates: true })
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/pt-BR/login?error=callback`)
}
