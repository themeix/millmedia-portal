'use client'

import DashboardLayout from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Users, Activity } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts'
import RefreshButton from '@/components/refresh-button'

interface Publication {
  name: string
  domain: string
  target: number
  current: number
  newThisMonth: number
  last30Days: number
  siteId?: number
  id?: number
}

interface AllCompany {
  current: number
  newThisMonth: number
  last30Days: number
}

interface DailyDataPoint {
  date: string
  actual: number
}

interface WeeklyDataPoint {
  weekStart: string
  weekEnd: string
  actual: number
}

interface TimeSeriesData {
  dailyData: DailyDataPoint[]
  weeklyData: WeeklyDataPoint[]
}

interface DashboardData {
  publications: Publication[]
  timeSeriesData?: Record<string, TimeSeriesData>
  dailyData?: DailyDataPoint[]
  weeklyData?: WeeklyDataPoint[]
  allCompany?: AllCompany
  summary: {
    current: string
    ninetyDaysAgo: string
    growth: string
    growthRate: string
    dateRange: string
  }
  timestamp: string
}

const NEUTRAL = '#A1A1AA'

function Sparkline({ data, color }: { data: DailyDataPoint[]; color: string }) {
  if (!data || data.length === 0) {
    return <div className="h-9 w-24" />
  }
  return (
    <ResponsiveContainer width={96} height={36}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="actual"
          stroke={color}
          strokeWidth={1.75}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default function FreeSubscribersPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [selectedSite, setSelectedSite] = useState<string>('all')

  const fetchData = async (forceRefresh = false) => {
    try {
      const url = '/api/dashboard/free/daily'
      const cacheKey = 'free_dashboard_data'
      const cacheDuration = 24 * 60 * 60 * 1000

      const loadFromCacheOrFetch = async (ck: string, u: string) => {
        if (!forceRefresh) {
          const cached = localStorage.getItem(ck)
          if (cached) {
            try {
              const parsedCache = JSON.parse(cached)
              const age = Date.now() - parsedCache.ts
              if (age < cacheDuration) {
                return parsedCache.data as DashboardData
              }
            } catch (e) {
              localStorage.removeItem(ck)
            }
          }
        }

        const response = await fetch(u)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const result = await response.json()
        localStorage.setItem(ck, JSON.stringify({
          data: result,
          ts: Date.now()
        }))
        return result as DashboardData
      }

      const result = await loadFromCacheOrFetch(cacheKey, url)
      setData(result)
      setLastRefreshed(new Date())
      setError(null)
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    localStorage.removeItem('free_dashboard_data')
    await fetchData(true)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getTimeSeriesData = () => {
    if (!data) return { dailyData: [], weeklyData: [] }
    
    if (data.timeSeriesData) {
      return data.timeSeriesData[selectedSite] || data.timeSeriesData['all'] || { dailyData: [], weeklyData: [] }
    }
    
    return {
      dailyData: data.dailyData || [],
      weeklyData: data.weeklyData || []
    }
  }

  const timeSeries = getTimeSeriesData()
  const selectedPub = data?.publications?.find(p => 
    selectedSite !== 'all' && p.siteId === Number(selectedSite)
  )

  const toNumber = (value: string | number | undefined) => {
    if (value === undefined || value === null) return 0
    const parsed = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]/g, ''))
    return Number.isFinite(parsed) ? parsed : 0
  }

  const totalCurrent = toNumber(data?.summary.current)
  const totalGrowth = toNumber(data?.summary.growth)

  useEffect(() => {
    const checkCache = async () => {
      const cached = localStorage.getItem('free_dashboard_data')
      if (cached) {
        try {
          const obj = JSON.parse(cached)
          const age = Date.now() - obj.ts
          const cacheDuration = 24 * 60 * 60 * 1000
          
          if (age < cacheDuration) {
            setData(obj.data)
            setLastRefreshed(new Date(obj.ts))
            setLoading(false)
            return
          } else {
            localStorage.removeItem('free_dashboard_data')
          }
        } catch (e) {
          localStorage.removeItem('free_dashboard_data')
        }
      }
      
      await fetchData()
    }
    checkCache()
  }, [])

  if (loading && !data) {
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

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="text-red-500">{error || 'No data available'}</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-6xl p-6 lg:p-10">
        <div className="mb-10 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">Subscribers</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">Free Subscribers</h1>
          </div>
          <RefreshButton
            onRefresh={handleRefresh}
            isLoading={loading}
            lastRefreshed={lastRefreshed}
            cacheAge={lastRefreshed ? Math.floor((Date.now() - lastRefreshed.getTime()) / 60000) : -1}
          />
        </div>

        <div className="mb-12 grid grid-cols-1 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex items-center justify-between gap-4 p-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-zinc-400">Total</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900">
                {selectedSite === 'all' ? data.summary.current : (selectedPub?.current ?? 0).toLocaleString()}
              </p>
              <p className="mt-1 text-xs tabular-nums text-zinc-500">
                +{selectedSite === 'all' ? data.summary.growth : (selectedPub?.newThisMonth ?? 0).toLocaleString()} <span className="text-zinc-400">this month</span>
              </p>
            </div>
            <Sparkline data={timeSeries.dailyData} color={NEUTRAL} />
          </div>

          <div className="flex items-center justify-between gap-4 p-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-zinc-400">New This Month</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900">
                +{selectedSite === 'all' 
                  ? data?.publications.reduce((sum, pub) => sum + (pub.newThisMonth || 0), 0).toLocaleString()
                  : (selectedPub?.newThisMonth ?? 0).toLocaleString()}
              </p>
              <p className="mt-1 text-xs tabular-nums text-zinc-500">
                <span className="text-zinc-400">{selectedSite === 'all' ? 'All sites' : selectedPub?.name || 'All sites'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 p-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-zinc-400">30-Day Growth</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900">
                +{selectedSite === 'all' ? totalGrowth : (selectedPub?.last30Days ?? 0).toLocaleString()}
              </p>
              <p className="mt-1 text-xs tabular-nums text-zinc-500">
                {selectedSite === 'all' ? data.summary.growthRate : ((selectedPub?.current || 0) > 0 ? ((selectedPub?.newThisMonth || 0) / (selectedPub?.current || 1) * 100).toFixed(1) : '0')}% <span className="text-zinc-400">growth rate</span>
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="growth" className="space-y-6">
          <TabsList>
            <TabsTrigger value="growth">Growth</TabsTrigger>
            <TabsTrigger value="publications">Publications</TabsTrigger>
          </TabsList>

          <TabsContent value="growth" className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">
                  {selectedSite === 'all' ? 'All sites' : selectedPub?.name}
                </h2>
                <p className="text-sm text-zinc-500">
                  {selectedSite === 'all'
                    ? 'Combined daily growth across every publication'
                    : `${selectedPub?.domain}`}
                </p>
              </div>
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {data.publications.map((pub) => (
                    <SelectItem key={String(pub.siteId)} value={String(pub.siteId)}>
                      {pub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-zinc-200 shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-500">Daily growth</CardTitle>
                  <CardDescription className="text-xs">New free subscribers, last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={timeSeries.dailyData}>
                      <defs>
                        <linearGradient id="colorFreeGrowth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={NEUTRAL} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={NEUTRAL} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fontSize: 11, fill: '#A1A1AA' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(value) => value.toLocaleString()}
                        tick={{ fontSize: 11, fill: '#A1A1AA' }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip
                        labelFormatter={formatFullDate}
                        formatter={(value: number) => [value.toLocaleString(), 'New free']}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E4E4E7' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="actual"
                        stroke={NEUTRAL}
                        strokeWidth={1.75}
                        fillOpacity={1}
                        fill="url(#colorFreeGrowth)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-zinc-200 shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-500">Weekly growth</CardTitle>
                  <CardDescription className="text-xs">New free subscribers by week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={timeSeries.weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                      <XAxis
                        dataKey="weekStart"
                        tickFormatter={formatDate}
                        tick={{ fontSize: 11, fill: '#A1A1AA' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(value) => value.toLocaleString()}
                        tick={{ fontSize: 11, fill: '#A1A1AA' }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip
                        labelFormatter={(value) => {
                          const item = (timeSeries.weeklyData || []).find((d: any) => d.weekStart === value)
                          if (item) {
                            return `${formatFullDate(item.weekStart)} - ${formatFullDate(item.weekEnd)}`
                          }
                          return value
                        }}
                        formatter={(value: number) => [value.toLocaleString(), 'Weekly growth']}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E4E4E7' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke={NEUTRAL}
                        strokeWidth={1.75}
                        dot={{ r: 3 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="border-zinc-200 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">Growth trend</CardTitle>
                <CardDescription className="text-xs">Daily free subscriber patterns, last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={timeSeries.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 11, fill: '#A1A1AA' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(value) => value.toLocaleString()}
                      tick={{ fontSize: 11, fill: '#A1A1AA' }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip
                      labelFormatter={formatFullDate}
                      formatter={(value: number) => [value.toLocaleString(), 'New free']}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E4E4E7' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke={NEUTRAL}
                      strokeWidth={1.75}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="publications" className="space-y-6">
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <div className="grid grid-cols-[1.6fr_repeat(4,1fr)] gap-2 border-b border-zinc-200 bg-zinc-50/60 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-zinc-400">
                <span>Publication</span>
                <span className="text-right">Target</span>
                <span className="text-right">Total</span>
                <span className="text-right">New</span>
                <span className="text-right">30d</span>
              </div>

              {data.publications.map((pub) => (
                <div
                  key={pub.siteId}
                  className="grid grid-cols-[1.6fr_repeat(4,1fr)] items-center gap-2 border-b border-zinc-100 px-5 py-3.5 text-sm last:border-b-0 hover:bg-zinc-50/70"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900">{pub.name}</p>
                    <p className="truncate text-xs text-zinc-400">{pub.domain}</p>
                  </div>
                  <span className="text-right tabular-nums text-zinc-500">{(pub.target ?? 0).toLocaleString()}</span>
                  <span className="text-right tabular-nums font-medium text-zinc-900">{(pub.current ?? 0).toLocaleString()}</span>
                  <span className="text-right tabular-nums text-zinc-500">+{(pub.newThisMonth ?? 0).toLocaleString()}</span>
                  <span className="text-right tabular-nums text-zinc-500">+{(pub.last30Days ?? 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}