import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { getCurrentUserData } from '@/lib/org/queries'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUserData()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="flex-1 ml-56 overflow-y-auto pt-14 relative z-10">
        {children}
      </div>
    </div>
  )
}
