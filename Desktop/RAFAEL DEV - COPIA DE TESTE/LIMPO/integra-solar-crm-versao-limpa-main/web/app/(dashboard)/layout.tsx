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
    <div className="flex h-screen bg-[#F2F5F8]">
      <Sidebar user={user} />
      <div className="flex-1 ml-56 overflow-y-auto pt-14">
        {children}
      </div>
    </div>
  )
}
