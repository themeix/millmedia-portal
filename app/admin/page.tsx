'use client'

import DashboardLayout from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import RefreshButton from '@/components/refresh-button'
import { publications } from '@/lib/publications'

interface AdminData {
  targets: any[]
  paidCount: number
  freeCount: number
}

const LS_KEY = 'publication_targets'

function loadLocal() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export default function AdminPage() {
  const [data, setData] = useState<AdminData>({
    targets: loadLocal() || [],
    paidCount: 0,
    freeCount: 0
  })
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/targets')
      const result = await res.json()
      const targets = result?.targets || []
      if (result?.dbError) {
        setError(`Database error: ${result.dbError}`)
      } else {
        setError(null)
      }
      setData((prev) => ({ ...prev, targets }))
      setLastRefreshed(new Date())
    } catch {
      setError('Failed to load target settings')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    await fetchData()
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const targets = publications.flatMap((pub) => {
        const freeSaved = data.targets.find((t) => t.site_id === pub.siteId && t.metric_type === 'free')
        const paidSaved = data.targets.find((t) => t.site_id === pub.siteId && t.metric_type === 'paid')
        const freeCurrent = editing[`${pub.siteId}-free`]
        const paidCurrent = editing[`${pub.siteId}-paid`]
        return [
          {
            site_id: pub.siteId,
            metric_type: 'free',
            target_value: freeCurrent !== undefined ? Number(freeCurrent) : (freeSaved?.target_value ?? pub.target ?? 0)
          },
          {
            site_id: pub.siteId,
            metric_type: 'paid',
            target_value: paidCurrent !== undefined ? Number(paidCurrent) : (paidSaved?.target_value ?? pub.target ?? 0)
          }
        ]
      })

      const res = await fetch('/api/admin/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets })
      })
      const result = await res.json()
      setData((prev) => ({ ...prev, targets: result?.targets || targets }))
      setEditing({})
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getTargetForSite = (siteId: number, metricType: string) => {
    const local = loadLocal()
    return local?.find((t: any) => t.site_id === siteId && t.metric_type === metricType) || data.targets.find((t) => t.site_id === siteId && t.metric_type === metricType)
  }

  if (loading && data.targets.length === 0) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="text-red-500">{error}</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-6xl p-6 lg:p-10">
        <div className="mb-10 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">Settings</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">Admin Panel</h1>
          </div>
          <RefreshButton
            onRefresh={handleRefresh}
            isLoading={loading}
            lastRefreshed={lastRefreshed}
            cacheAge={lastRefreshed ? Math.floor((Date.now() - lastRefreshed.getTime()) / 60000) : -1}
          />
        </div>

        <Tabs defaultValue="targets" className="space-y-6">
          <TabsList>
            <TabsTrigger value="targets">Targets</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="targets" className="space-y-6">
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <div className="grid grid-cols-[1.6fr_repeat(2,1fr)_auto] gap-2 border-b border-zinc-200 bg-zinc-50/60 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-zinc-400">
                <span>Publication</span>
                <span>Free Target</span>
                <span>Paid Target</span>
              </div>

              {publications.map((pub) => {
                const freeTarget = getTargetForSite(pub.siteId, 'free')
                const paidTarget = getTargetForSite(pub.siteId, 'paid')
                const freeValue = editing[`${pub.siteId}-free`] ?? String(freeTarget?.target_value ?? pub.target ?? 0)
                const paidValue = editing[`${pub.siteId}-paid`] ?? String(paidTarget?.target_value ?? pub.target ?? 0)

                return (
                  <div
                    key={pub.siteId}
                    className="grid grid-cols-[1.6fr_repeat(2,1fr)_auto] items-center gap-2 border-b border-zinc-100 px-5 py-3.5 text-sm last:border-b-0 hover:bg-zinc-50/70"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900">{pub.name}</p>
                      <p className="truncate text-xs text-zinc-400">{pub.domain}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        className="w-28 border-zinc-200"
                        value={freeValue}
                        onChange={(e) =>
                          setEditing((prev) => ({ ...prev, [`${pub.siteId}-free`]: e.target.value }))
                        }
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        className="w-28 border-zinc-200"
                        value={paidValue}
                        onChange={(e) =>
                          setEditing((prev) => ({ ...prev, [`${pub.siteId}-paid`]: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="border-zinc-200">
                {saving ? 'Saving...' : 'Save Targets'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <Card className="border-zinc-200 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">Publication Configuration</CardTitle>
                <CardDescription className="text-xs">Currently configured publications in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                  <div className="grid grid-cols-[1.6fr_repeat(2,1fr)] gap-2 border-b border-zinc-200 bg-zinc-50/60 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-zinc-400">
                    <span>Publication</span>
                    <span className="text-right">Site ID</span>
                    <span className="text-right">Default Target</span>
                  </div>

                  {publications.map((pub) => (
                    <div
                      key={pub.siteId}
                      className="grid grid-cols-[1.6fr_repeat(2,1fr)] items-center gap-2 border-b border-zinc-100 px-5 py-3.5 text-sm last:border-b-0 hover:bg-zinc-50/70"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-900">{pub.name}</p>
                        <p className="truncate text-xs text-zinc-400">{pub.domain}</p>
                      </div>
                      <span className="text-right tabular-nums text-zinc-500">{pub.siteId}</span>
                      <span className="text-right tabular-nums text-zinc-500">{(pub.target ?? 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
