'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Users, Settings, LayoutDashboard, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Paid Subscribers', href: '/paid', icon: BarChart3 },
  { name: 'Free Subscribers', href: '/free', icon: Users },
  { name: 'Admin', href: '/admin', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-zinc-50">
      <aside className="fixed left-0 top-0 z-10 h-screen w-60 border-r border-zinc-200 bg-white">
        {/* Wordmark — plain ink monogram instead of a gradient tile */}
        <div className="flex h-16 items-center gap-2.5 border-b border-zinc-200 px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900">
            <TrendingUp className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-zinc-900">Mill Media</span>
        </div>

        {/* Nav — active state is a quiet tint + accent rule, not a solid filled button */}
        <nav className="space-y-0.5 p-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-indigo-600" />
                )}
                <item.icon className="h-4 w-4" strokeWidth={2} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Status — plain dot instead of a colored icon badge */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-200 p-4">
          <div className="flex items-center gap-2.5 px-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-zinc-700">Data status</p>
              <p className="truncate text-xs text-zinc-400">24h cache enabled</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="ml-60">
        <div className="sticky top-0 z-[5] h-16 border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
          <div className="flex h-full items-center justify-between px-6">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span>Mill Media Analytics</span>
              <span>/</span>
              <span className="font-medium text-zinc-900">
                {pathname === '/' ? 'Dashboard' : pathname.slice(1).charAt(0).toUpperCase() + pathname.slice(2)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Live</span>
            </div>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}