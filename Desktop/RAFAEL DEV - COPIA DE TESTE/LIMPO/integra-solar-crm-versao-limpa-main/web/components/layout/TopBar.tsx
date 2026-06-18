interface TopBarProps {
  title: string
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="fixed left-56 right-0 top-0 h-14 bg-white border-b border-[#DDE3EB] flex items-center px-5 z-40 shadow-sm">
      <h1 className="text-[15px] font-bold text-[#1A2B3C]">{title}</h1>
    </header>
  )
}
