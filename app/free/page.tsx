'use client'

import DashboardLayout from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Users, Target, Calendar, Loader2, BarChart3, Activity, Zap, ArrowUp, ArrowDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, Legend } from 'recharts'
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

export default function FreeSubscribersPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [selectedSite, setSelectedSite] = useState<string>('all')

  const fetchData = async (forceRefresh = false) => {
    setLoading(true)
    try {
      const url = '/api/dashboard/free/daily'
      const cacheKey = 'free_dashboard_data'
      const cacheDuration = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

      if (!forceRefresh) {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          try {
            const parsedCache = JSON.parse(cached)
            const age = Date.now() - parsedCache.ts
            
            if (age < cacheDuration) {
              setData(parsedCache.data as DashboardData)
              setLastRefreshed(new Date(parsedCache.ts))
              setLoading(false)
              return
            } else {
              localStorage.removeItem(cacheKey)
            }
          } catch (e) {
            localStorage.removeItem(cacheKey)
          }
        }
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      localStorage.setItem(cacheKey, JSON.stringify({
        data: result,
        ts: Date.now()
      }))
      
      setData(result as DashboardData)
      setLastRefreshed(new Date())
      setError(null)
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    localStorage.removeItem('free_dashboard_data');
    await fetchData(true)
  }

  const calculateProgress = (current: number, target: number) => {
    if (target === 0) return 0
    return Math.min((current / target) * 100, 100)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatWeek = (dateStr: string) => {
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



  useEffect(() => {
    const checkCache = async () => {
      const cached = localStorage.getItem('free_dashboard_data');
      if (cached) {
        try {
          const obj = JSON.parse(cached);
          const age = Date.now() - obj.ts;
          const cacheDuration = 24 * 60 * 60 * 1000; // 24 hours
          
          if (age < cacheDuration) {
            setData(obj.data);
            setLastRefreshed(new Date(obj.ts));
            setLoading(false);
            return;
          } else {
            localStorage.removeItem('free_dashboard_data');
          }
        } catch (e) {
          localStorage.removeItem('free_dashboard_data');
        }
      }
      
      await fetchData();
    };
    checkCache();
  }, [])

  if (loading) {
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
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold tracking-tight">Free Subscribers</h1>
          <RefreshButton 
            onRefresh={handleRefresh}
            isLoading={loading}
            lastRefreshed={lastRefreshed}
            cacheAge={lastRefreshed ? Math.floor((Date.now() - lastRefreshed.getTime()) / 60000) : -1}
          />
          </div>
          <p className="text-muted-foreground mt-1">Subscriber growth and publication performance</p>
        </div>
        
        <Tabs defaultValue="growth" className="space-y-6">
          <TabsList>
            <TabsTrigger value="growth">Growth Chart</TabsTrigger>
            <TabsTrigger value="publications">Publications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="growth" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4 flex-1">
                <Select value={selectedSite} onValueChange={setSelectedSite}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a site">
                      {selectedSite === 'all' ? 'All Sites' : selectedPub?.name || 'Select a site'}
                    </SelectValue>
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
                {selectedSite !== 'all' && selectedPub && (
                  <Badge variant="outline" className="text-base py-1 px-3">
                    {selectedPub.name}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">
                {selectedSite === 'all' ? 'All Sites Growth Dashboard' : `${selectedPub?.name} Growth Dashboard`}
              </h2>
              <p className="text-muted-foreground">
                {selectedSite === 'all' 
                  ? 'Viewing subscriber growth across all publications' 
                  : `Viewing subscriber growth for ${selectedPub?.name} (${selectedPub?.domain})`
                }
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {selectedSite === 'all' 
                      ? data.summary.current 
                      : (selectedPub?.current || 0).toLocaleString()
                    }
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Activity className="h-3 w-3 text-green-500" />
                    <span>+{selectedSite === 'all' 
                      ? data.summary.growth 
                      : (selectedPub?.newThisMonth || 0).toLocaleString()
                    } this month</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {selectedSite === 'all' 
                      ? data.summary.growthRate 
                      : (selectedPub?.current || 0) > 0 
                        ? ((selectedPub?.newThisMonth || 0) / (selectedPub?.current || 1) * 100).toFixed(1)
                        : '0'
                    }%
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Based on last 30 days</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Data Range</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">30 days</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{data.summary.dateRange}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Daily Growth Chart - {selectedSite === 'all' ? 'All Sites' : selectedPub?.name}
                  </CardTitle>
                  <CardDescription>
                    {selectedSite === 'all' ? 'All sites' : selectedPub?.name} - Subscriber growth over the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={timeSeries.dailyData}>
                      <defs>
                        <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        className="text-xs"
                      />
                      <YAxis 
                        tickFormatter={(value) => value.toLocaleString()}
                        className="text-xs"
                      />
                      <Tooltip 
                        labelFormatter={formatFullDate}
                        formatter={(value: number) => [value.toLocaleString(), 'New Subscribers']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="actual" 
                        stroke="#8b5cf6" 
                        fillOpacity={1}
                        fill="url(#colorGrowth)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    Weekly Growth Chart - {selectedSite === 'all' ? 'All Sites' : selectedPub?.name}
                  </CardTitle>
                  <CardDescription>
                    {selectedSite === 'all' ? 'All sites' : selectedPub?.name} - Subscriber growth by week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timeSeries.weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="weekStart" 
                        tickFormatter={formatWeek}
                        className="text-xs"
                      />
                      <YAxis 
                        tickFormatter={(value) => value.toLocaleString()}
                        className="text-xs"
                      />
                      <Tooltip 
                        labelFormatter={(value) => {
                          const item = timeSeries.weeklyData?.find((d: any) => d.weekStart === value)
                          if (item) {
                            return `${formatFullDate(item.weekStart)} - ${formatFullDate(item.weekEnd)}`
                          }
                          return value
                        }}
                        formatter={(value: number) => [value.toLocaleString(), 'Weekly Growth']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="actual" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>
                  Growth Trend Analysis - {selectedSite === 'all' ? 'All Sites' : selectedPub?.name}
                </CardTitle>
                <CardDescription>
                  {selectedSite === 'all' ? 'All sites' : selectedPub?.name} - Detailed breakdown of subscriber patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={timeSeries.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      className="text-xs"
                    />
                    <YAxis 
                      tickFormatter={(value) => value.toLocaleString()}
                      className="text-xs"
                    />
                    <Tooltip 
                      labelFormatter={formatFullDate}
                      formatter={(value: number) => [value.toLocaleString(), 'New Subscribers']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="publications" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {data.publications.map((pub, index) => (
                <Card key={index} className="border-l-4" style={{
                  borderLeftColor: ['#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#10b981', '#06b6d4'][index % 6]
                }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{pub.name}</CardTitle>
                    <Badge variant="outline">{pub.domain}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Target</span>
                        <span className="font-semibold">{(pub.target ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Current</span>
                        <span className="font-bold text-lg">{(pub.current ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${calculateProgress(pub.newThisMonth ?? 0, pub.target ?? 0)}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Activity className="h-3 w-3 text-green-500" />
                          New this month
                        </div>
                        <div className="text-lg font-semibold text-blue-600">
                          {(pub.newThisMonth ?? 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Last 30 days
                        </div>
                        <div className="text-lg font-semibold text-green-600">
                          {(pub.last30Days ?? 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}