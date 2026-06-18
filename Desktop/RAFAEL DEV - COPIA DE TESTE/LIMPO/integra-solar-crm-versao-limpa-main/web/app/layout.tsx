import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Integra Solar — Plataforma de Gestão',
  description: 'CRM para gestão de projetos de energia solar.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  )
}
