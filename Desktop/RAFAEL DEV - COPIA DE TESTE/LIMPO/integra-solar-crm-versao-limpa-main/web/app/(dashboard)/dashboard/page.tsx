import type { Metadata } from 'next'
import { TopBar } from '@/components/layout/TopBar'
import { getCurrentUserData } from '@/lib/org/queries'

export const metadata: Metadata = {
  title: 'Dashboard — Integra Solar',
}

export default async function DashboardPage() {
  const user = await getCurrentUserData()

  return (
    <>
      <TopBar title="Dashboard" />
      <main className="p-6">
        <div className="rounded-xl border border-[#DDE3EB] bg-white p-8 text-center">
          <h2 className="text-lg font-bold text-[#1A2B3C]">
            Bem-vindo, {user?.profile.full_name ?? 'usuário'}!
          </h2>
          {user?.membership && (
            <p className="mt-2 text-sm text-[#7A90A4]">
              Organização:{' '}
              <span className="font-semibold text-[#1A3A5C]">
                {user.membership.organization.name}
              </span>
            </p>
          )}
          <p className="mt-4 text-sm text-[#7A90A4]">
            Módulos do CRM em desenvolvimento. Autenticação e multi-tenancy
            configurados com sucesso.
          </p>
        </div>
      </main>
    </>
  )
}
