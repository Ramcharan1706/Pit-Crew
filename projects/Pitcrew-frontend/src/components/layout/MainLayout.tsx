import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface MainLayoutProps {
  children: React.ReactNode
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="relative bg-transparent text-slate-100">
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <Topbar onOpenSidebar={() => setMobileSidebarOpen(true)} />

      <main className="relative z-10 px-4 pb-6 pt-[88px] sm:px-6 lg:ml-[240px] lg:px-6 lg:pt-[88px]">
        <div className="panel-enter mx-auto max-w-[1400px]">{children}</div>
      </main>
    </div>
  )
}
