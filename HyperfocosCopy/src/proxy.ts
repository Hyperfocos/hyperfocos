import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const locales = ['pt-BR', 'en']
const defaultLocale = 'pt-BR'

// Rotas que NÃO precisam de autenticação
const publicRoutes = [
  '/login',
  '/signup',
  '/callback',
  '/',          // landing page
  '/pricing',
]

function getLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get('locale')?.value
  if (cookieLocale && locales.includes(cookieLocale)) return cookieLocale

  const acceptLanguage = request.headers.get('accept-language') ?? ''
  if (acceptLanguage.includes('pt-BR') || acceptLanguage.includes('pt')) return 'pt-BR'

  return defaultLocale
}

function isPublicRoute(pathname: string): boolean {
  // Remove o locale do pathname para checar
  const withoutLocale = pathname.replace(/^\/(pt-BR|en)/, '') || '/'
  return publicRoutes.some(route => withoutLocale === route || withoutLocale.startsWith(route + '/'))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignorar arquivos estáticos e APIs
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Detectar locale e redirecionar se necessário
  const hasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (!hasLocale) {
    const locale = getLocale(request)
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}${pathname}`
    return NextResponse.redirect(url)
  }

  // Atualizar sessão Supabase
  const { supabaseResponse, user } = await updateSession(request)

  // Redirecionar para login se rota protegida e não autenticado
  if (!user && !isPublicRoute(pathname)) {
    const locale = getLocale(request)
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/login`
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Redirecionar para dashboard se já autenticado tentando acessar login/signup
  if (user && (pathname.includes('/login') || pathname.includes('/signup'))) {
    const locale = getLocale(request)
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/dashboard`
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
