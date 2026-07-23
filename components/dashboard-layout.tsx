'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Users, Settings, LayoutDashboard, TrendingUp, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Paid Subscribers', href: '/', icon: BarChart3 },
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
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 z-10 h-screen w-64 border-r bg-background">
        <div className="flex h-16 items-center justify-center border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Mill Media</h1>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">System Status</p>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </div>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </div>
        </div>
      </aside>
      <main className="ml-64">
        <div className="h-16 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-5">
          <div className="h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Mill Media Analytics</span>
              <span>/</span>
              <span className="text-foreground font-medium">
                {pathname === '/' ? 'Dashboard' : pathname.slice(1).charAt(0).toUpperCase() + pathname.slice(2)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-muted-foreground">Live</span>
              </div>
            </div>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}