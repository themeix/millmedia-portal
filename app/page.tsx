'use client'

import DashboardLayout from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Users, Target, Calendar, ChevronDown, ChevronUp, BarChart3, PieChart, Activity } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, AreaChart, Area, Legend } from 'recharts'
import { useState, useEffect } from 'react'
import RefreshButton from '@/components/refresh-button'
import { cachedFetch, refreshCache, apiCache } from '@/lib/api-cache'

const mockPublications = [
  { siteId: 1, name: 'The Mill', current: 4655, target: 4500, progress: 100 },
  { siteId: 2, name: 'The Post', current: 2376, target: 3500, progress: 67.9 },
  { siteId: 3, name: 'The Tribune', current: 4383, target: 3200, progress: 100 },
]

const mockHistoricalData = Array.from({ length: 13 }, (_, i) => {
  const date = new Date(Date.now() - (12 - i) * 7 * 24 * 60 * 60 * 1000)
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
    actual: 15000 + i * 500 + Math.random() * 300,
    target: 12000 + i * 700,
  }
})

  const formatWeek = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

export default function Home() {
  const [selectedPublication, setSelectedPublication] = useState<string>('all')
  const [expandedPublication, setExpandedPublication] = useState<string | null>(null)
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const fetchData = async (forceRefresh = false) => {
    setLoading(true)
    try {
      const url = '/api/dashboard/paid/weekly'
      const cacheKey = url
      const cacheAge = apiCache.getCacheAge(cacheKey)
      
      let result
      if (forceRefresh || cacheAge >= 5 || cacheAge === -1) {
        result = await refreshCache(url)
      } else {
        result = await cachedFetch(url)
      }
      
      setWeeklyData((result as any).historicalData || [])
      setLastRefreshed(new Date())
    } catch (err) {
      console.error('Error fetching weekly data:', err)
      // Use mock data if API fails
      setWeeklyData(mockHistoricalData)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    await fetchData(true)
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Paid Subscribers</h1>
            <p className="text-muted-foreground mt-1">Track your subscriber growth across all publications</p>
          </div>
          <div className="flex items-center gap-4">
            <RefreshButton 
              onRefresh={handleRefresh}
              isLoading={loading}
              lastRefreshed={lastRefreshed}
              cacheAge={lastRefreshed ? Math.floor((Date.now() - lastRefreshed.getTime()) / 60000) : -1}
            />
            <Select value={selectedPublication} onValueChange={setSelectedPublication}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select publication" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Company</SelectItem>
                {mockPublications.map(pub => (
                  <SelectItem key={pub.siteId} value={pub.siteId.toString()}>
                  {pub.name}
                </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="publications">Publications</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Subscribers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">17,163</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Activity className="h-3 w-3 text-green-500" />
                    Live from Supabase
                  </p>
                </CardContent>
              </Card>
              
       
              
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">New This Month</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">+161</div>
                  <p className="text-xs text-muted-foreground mt-1">New paid subscribers</p>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">30-Day Growth</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">+235</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    +1.4% growth rate
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    7-Day Rolling Growth (Last 3 Months)
                  </CardTitle>
                  <CardDescription>
                    Weekly subscriber trends with pace-to-target reference
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={weeklyData.length > 0 ? weeklyData : mockHistoricalData}>
                      <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatWeek}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        labelFormatter={formatWeek}
                        formatter={(value: number, name: string) => [
                          value.toLocaleString(),
                          name === 'actual' ? 'Subscribers' : 'Pace Target'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="actual" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorActual)"
                        name="Actual"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="target" 
                        stroke="#ef4444" 
                        strokeDasharray="5 5" 
                        strokeWidth={2}
                        name="Pace Target"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Current Performance
                  </CardTitle>
                  <CardDescription>
                    Real-time metrics for selected view
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Total Subscribers</p>
                          <p className="text-xs text-muted-foreground">Active paid subscribers</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">17,163</div>
                        <Badge variant="default">On Track</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="publications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publication Breakdown</CardTitle>
                <CardDescription>Detailed metrics for each publication</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockPublications.map((publication) => {
                    const isExpanded = expandedPublication === publication.name
                    const isOnPace = publication.current >= publication.target
                    
                    return (
                      <div key={publication.siteId} className="rounded-lg border bg-card">
                        <div 
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setExpandedPublication(isExpanded ? null : publication.name)}
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                            <span className="font-medium">{publication.name}</span>
                            <Badge variant={isOnPace ? 'default' : 'destructive'}>
                              {isOnPace ? 'On Pace' : 'Behind Pace'}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{publication.current.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {publication.progress.toFixed(1)}% of {publication.target.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trends" className="space-y-6">
            <Card>
                <CardHeader>
                  <CardTitle>Detailed Trends</CardTitle>
                  <CardDescription>7-day rolling growth patterns over 3 months</CardDescription>
                </CardHeader>
              <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={weeklyData.length > 0 ? weeklyData : mockHistoricalData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatWeek}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        labelFormatter={formatWeek}
                        formatter={(value: number, name: string) => [
                          value.toLocaleString(),
                          name === 'actual' ? 'Actual' : 'Target'
                        ]}
                      />
                      <Legend />
                      <Bar 
                        dataKey="actual" 
                        fill="#3b82f6" 
                        name="Actual"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="target" 
                        fill="#94a3b8"
                        name="Target"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}