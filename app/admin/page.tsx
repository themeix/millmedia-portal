'use client'

import DashboardLayout from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Plus, RefreshCw, CheckCircle, Clock, Target, Loader2, Settings, Database, Shield, Activity, AlertTriangle } from 'lucide-react'
import { useState, useEffect } from 'react'
import RefreshButton from '@/components/refresh-button'
import { cachedFetch, refreshCache, apiCache } from '@/lib/api-cache'

interface AdminData {
  syncRuns: any[]
  targets: any[]
  paidCount: number
  freeCount: number
}

const mockSyncRuns = [
  { id: 1, created_at: new Date().toISOString(), status: 'completed' },
  { id: 2, created_at: new Date(Date.now() - 3600000).toISOString(), status: 'completed' },
  { id: 3, created_at: new Date(Date.now() - 7200000).toISOString(), status: 'failed' },
]

const mockTargets = [
  { id: 1, site_id: 'The Mill', metric_type: 'paid', current: 4655, target_value: 4500, progress: 103.4, month: '2026-08' },
  { id: 2, site_id: 'The Post', metric_type: 'paid', current: 2376, target_value: 3500, progress: 67.9, month: '2026-08' },
  { id: 3, site_id: 'All Publications', metric_type: 'paid', current: 17163, target_value: 21200, progress: 81.0, month: '2026-08' },
]

export default function AdminPage() {
  const [data, setData] = useState<AdminData>({
    syncRuns: mockSyncRuns,
    targets: mockTargets,
    paidCount: 17163,
    freeCount: 263263
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const fetchData = async (forceRefresh = false) => {
    setLoading(true)
    try {
      const url = '/api/admin/data'
      const cacheKey = url
      const cacheAge = apiCache.getCacheAge(cacheKey)
      
      let result
      if (forceRefresh || cacheAge >= 5 || cacheAge === -1) {
        result = await refreshCache(url)
      } else {
        result = await cachedFetch(url)
      }
      
      setData(result as AdminData)
      setLastRefreshed(new Date())
      setError(null)
    } catch (err) {
      setError('Failed to load admin data')
      console.error('Error fetching admin data:', err)
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
  
  const [newTarget, setNewTarget] = useState({
    publication: 'The Mill',
    metricType: 'paid',
    targetValue: '',
    month: '2026-08'
  })

  const lastSync = data.syncRuns[0]
  const lastSyncTime = lastSync?.created_at ? new Date(lastSync.created_at).toLocaleString() : 'No sync data'

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
      <div className="container mx-auto p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
            <p className="text-muted-foreground mt-1">Manage targets, monitor syncs, and configure system settings</p>
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
            <TabsTrigger value="sync">Sync Monitoring</TabsTrigger>
            <TabsTrigger value="overview">System Overview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="targets" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Add New Target
                  </CardTitle>
                  <CardDescription>Set monthly growth targets for publications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Publication</label>
                      <Select 
                        value={newTarget.publication} 
                        onValueChange={(value) => setNewTarget({...newTarget, publication: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="The Mill">The Mill</SelectItem>
                          <SelectItem value="The Tribune">The Tribune</SelectItem>
                          <SelectItem value="The Post">The Post</SelectItem>
                          <SelectItem value="The Dispatch">The Dispatch</SelectItem>
                          <SelectItem value="The Bell">The Bell</SelectItem>
                          <SelectItem value="The Londoner">The Londoner</SelectItem>
                          <SelectItem value="The Exchange">The Exchange</SelectItem>
                          <SelectItem value="all">All Publications</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Metric Type</label>
                      <Select 
                        value={newTarget.metricType} 
                        onValueChange={(value) => setNewTarget({...newTarget, metricType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Paid Subscribers</SelectItem>
                          <SelectItem value="free">Free Subscribers</SelectItem>
                          <SelectItem value="newsletter">Newsletter Subscribers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Value</label>
                      <Input
                        type="number"
                        placeholder="Enter target number"
                        value={newTarget.targetValue}
                        onChange={(e) => setNewTarget({...newTarget, targetValue: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Month</label>
                      <Input
                        type="month"
                        value={newTarget.month}
                        onChange={(e) => setNewTarget({...newTarget, month: e.target.value})}
                      />
                    </div>
                    
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Target
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                  <CardDescription>Current system metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Database className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Paid Subscribers</p>
                          <p className="text-xs text-muted-foreground">Active paying members</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">{data.paidCount.toLocaleString()}</div>
                        <Badge variant="default">Active</Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Activity className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Free Subscribers</p>
                          <p className="text-xs text-muted-foreground">Newsletter members</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">{data.freeCount.toLocaleString()}</div>
                        <Badge variant="secondary">Growing</Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Target className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Active Targets</p>
                          <p className="text-xs text-muted-foreground">Monthly targets set</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">{data.targets.length}</div>
                        <Badge variant="outline">Configured</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Current Targets</CardTitle>
                <CardDescription>Active monthly targets by publication</CardDescription>
              </CardHeader>
              <CardContent>
                {data.targets.length > 0 ? (
                  <div className="space-y-3">
                    {data.targets.map((target) => (
                      <div key={target.id} className="rounded-lg border bg-card">
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Target className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{target.site_id || 'All Publications'}</span>
                                <Badge variant="secondary">{target.metric_type}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{target.month}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-medium">{target.current?.toLocaleString() || '0'}</p>
                              <p className="text-xs text-muted-foreground">Current</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{target.target_value?.toLocaleString() || '0'}</p>
                              <p className="text-xs text-muted-foreground">Target</p>
                            </div>
                            <div className="text-right min-w-[80px]">
                              <Badge variant={target.progress >= 100 ? 'default' : 'destructive'}>
                                {target.progress?.toFixed(1) || 0}%
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">Progress</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No targets set. Use the form above to add monthly targets.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="sync" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Sync Monitoring
                </CardTitle>
                <CardDescription>Data synchronization status and controls</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Last Sync</p>
                        <p className="text-xs text-muted-foreground">{lastSyncTime}</p>
                      </div>
                    </div>
                    <Badge variant="default">{lastSync?.status || 'Unknown'}</Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <Button variant="outline" className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Trigger Manual Sync
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Clock className="h-4 w-4 mr-2" />
                      View Sync History
                    </Button>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium text-sm mb-3">Recent Sync Runs</h4>
                    <div className="space-y-2">
                      {data.syncRuns.slice(0, 3).map((run, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${run.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            <span className="text-muted-foreground">{new Date(run.created_at).toLocaleString()}</span>
                          </div>
                          <Badge variant={run.status === 'completed' ? 'default' : 'secondary'}>
                            {run.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database
                  </CardTitle>
                  <CardDescription>Connection status and metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant="default">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Query</span>
                      <span className="text-sm">Just now</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Query Time</span>
                      <span className="text-sm">12ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security
                  </CardTitle>
                  <CardDescription>System security status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">API Status</span>
                      <Badge variant="default">Secure</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Auth Method</span>
                      <span className="text-sm">Supabase</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">SSL Status</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    System
                  </CardTitle>
                  <CardDescription>Platform and version info</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Platform</span>
                      <span className="text-sm">Next.js 15</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Environment</span>
                      <Badge variant="secondary">Production</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Version</span>
                      <span className="text-sm">1.0.0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  System Alerts
                </CardTitle>
                <CardDescription>Important notifications and warnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">System Healthy</p>
                      <p className="text-xs text-muted-foreground">All services are operating normally</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                    <Activity className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Data Sync Active</p>
                      <p className="text-xs text-muted-foreground">Automatic synchronization is running on schedule</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}