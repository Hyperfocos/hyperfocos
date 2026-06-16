import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HyperFoco — Para o cérebro com TDAH',
  description: 'O único app de tarefas feito para o cérebro com TDAH.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
