import Link from 'next/link'

export default function DashboardLayout({ children }) {
  // Simple SVG Icons
  const IconDashboard = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
  const IconMetrics = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
  const IconBlog = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
  const IconSocial = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
  const IconTasks = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
  const IconAdmin = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
  const IconLogout = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>

  return (
    <div className="flex h-screen bg-[#f8f9fa]"> 
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#113a3a] text-white flex flex-col shadow-2xl z-10">
        
        {/* Logo / Brand Area */}
        <div className="h-16 flex items-center px-6 border-b border-[#1c4f4f] bg-[#0d2e2e]">
          <div className="font-bold text-xl tracking-wide text-white">
            IQOL <span className="text-emerald-400 font-light">Dash</span>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          
          {/* Active Link - White Text */}
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-medium bg-[#1c4f4f] text-white rounded-lg shadow-sm border-l-4 border-emerald-500 transition-all">
            <IconDashboard /> Dashboard
          </Link>
          
          <div className="mt-6 mb-2 px-4 text-[10px] font-bold text-emerald-500 uppercase tracking-widest opacity-80">
            Data Management
          </div>
          
          {/* Standard Links - Gray-300 (looks white on dark bg) */}
          <Link href="/dashboard/upload-metrics" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 rounded-lg hover:bg-[#1c4f4f] hover:text-white hover:pl-5 transition-all duration-200">
            <IconMetrics /> Daily Metrics
          </Link>
          <Link href="/dashboard/upload-blogs" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 rounded-lg hover:bg-[#1c4f4f] hover:text-white hover:pl-5 transition-all duration-200">
             <IconBlog /> Blogs
          </Link>
          <Link href="/dashboard/upload-social" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 rounded-lg hover:bg-[#1c4f4f] hover:text-white hover:pl-5 transition-all duration-200">
             <IconSocial /> Social Media
          </Link>

          <div className="mt-6 mb-2 px-4 text-[10px] font-bold text-emerald-500 uppercase tracking-widest opacity-80">
            Work & Admin
          </div>
          
          <Link href="/dashboard/action-items" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 rounded-lg hover:bg-[#1c4f4f] hover:text-white hover:pl-5 transition-all duration-200">
             <IconTasks /> Action Items
          </Link>
           <Link href="/dashboard/admin/users" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 rounded-lg hover:bg-[#1c4f4f] hover:text-white hover:pl-5 transition-all duration-200">
             <IconAdmin /> Admin Users
          </Link>
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-[#1c4f4f] bg-[#0d2e2e]">
          <Link href="/" className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors">
            <IconLogout /> Log Out
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto bg-[#f8f9fa]">
        <div className="p-8 max-w-[1600px] mx-auto">
           {children}
        </div>
      </main>
    </div>
  )
}