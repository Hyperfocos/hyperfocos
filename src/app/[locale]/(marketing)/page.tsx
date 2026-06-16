import Link from 'next/link'

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const en = locale === 'en'

  return (
    <div className="min-h-screen bg-[#0e0e11] text-white">
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <div className="text-lg font-semibold tracking-tight">
          Hyper<span className="text-violet-400">Foco</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/pricing`} className="text-sm text-white/50 hover:text-white transition-colors">
            {en ? 'Pricing' : 'Planos'}
          </Link>
          <Link href={`/${locale}/login`} className="text-sm text-white/50 hover:text-white transition-colors">
            {en ? 'Sign in' : 'Entrar'}
          </Link>
          <Link href={`/${locale}/signup`}
            className="text-sm px-4 py-1.5 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-500 transition-colors">
            {en ? 'Get started' : 'Começar'}
          </Link>
        </div>
      </nav>

      <section className="max-w-3xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-8">
          {en ? '✦ Built for the ADHD brain' : '✦ Feito para o cérebro com TDAH'}
        </div>
        <h1 className="text-5xl font-light tracking-tight leading-tight mb-6">
          {en ? <>Stop <span className="text-violet-400">freezing</span>.<br />Start doing.</> :
                 <>Pare de <span className="text-violet-400">travar</span>.<br />Comece a fazer.</>}
        </h1>
        <p className="text-lg text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
          {en ? 'The only task app built for the ADHD brain. One mission at a time, 10-minute focus sprints, zero paralysis.'
               : 'O único app de tarefas feito para o cérebro com TDAH. Uma missão por vez, sprints de 10 minutos, zero paralisia.'}
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href={`/${locale}/signup`}
            className="px-7 py-3 rounded-xl bg-violet-600 text-white font-medium text-base hover:bg-violet-500 transition-all hover:-translate-y-0.5">
            {en ? 'Start for free' : 'Começar de graça'}
          </Link>
          <Link href={`/${locale}/pricing`} className="text-sm text-white/40 hover:text-white/70 transition-colors">
            {en ? 'See plans →' : 'Ver planos →'}
          </Link>
        </div>
        <p className="text-xs text-white/25 mt-4">{en ? 'No credit card required' : 'Sem cartão de crédito'}</p>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: '🎯', title: en ? 'Mission of the day' : 'Missão do dia',
              desc: en ? "One task. That's it. No overwhelming lists." : 'Uma tarefa. Só. Sem listas enormes.' },
            { icon: '⚡', title: en ? '10-minute focus' : 'Foco de 10 minutos',
              desc: en ? 'Short sprints that match how the ADHD brain works.' : 'Sprints curtos que combinam com o cérebro TDAH.' },
            { icon: '🧠', title: en ? 'Energy filter' : 'Filtro de energia',
              desc: en ? 'Tell the app your energy level. It shows only what you can handle.' : 'Diga sua energia. O app mostra só o que você consegue fazer.' },
          ].map(f => (
            <div key={f.title} className="bg-[#17171c] border border-white/[0.06] rounded-xl p-6">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-base font-medium text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-6 py-6 max-w-5xl mx-auto flex items-center justify-between text-xs text-white/25">
        <span>HyperFoco © 2025</span>
        <Link href={`/${locale === 'en' ? 'pt-BR' : 'en'}`} className="hover:text-white/50 transition-colors">
          {locale === 'en' ? 'Português' : 'English'}
        </Link>
      </footer>
    </div>
  )
}
