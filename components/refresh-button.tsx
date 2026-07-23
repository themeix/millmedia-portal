'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Clock } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface RefreshButtonProps {
  onRefresh: () => Promise<void>
  isLoading: boolean
  lastRefreshed?: Date | null
  cacheAge?: number // in minutes
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'outline' | 'ghost'
  showLastRefreshed?: boolean
  autoRefreshInterval?: number // in minutes, 0 to disable
}

export default function RefreshButton({
  onRefresh,
  isLoading,
  lastRefreshed = null,
  cacheAge = -1,
  size = 'default',
  variant = 'outline',
  showLastRefreshed = true,
  autoRefreshInterval = 5 // default 5 minutes
}: RefreshButtonProps) {
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  
  const handleRefresh = async () => {
    await onRefresh()
  }

  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled)
  }

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const getCacheStatus = () => {
    if (cacheAge === -1) return 'No cache'
    if (cacheAge < 1) return 'Just cached'
    return `Cached ${cacheAge}m ago`
  }

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={handleRefresh}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to refresh data</p>
          </TooltipContent>
        </Tooltip>
        
        {showLastRefreshed && lastRefreshed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p>Last refreshed: {formatTimeAgo(lastRefreshed)}</p>
                <p className="text-xs text-muted-foreground">{lastRefreshed.toLocaleTimeString()}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
      
      {showLastRefreshed && lastRefreshed && (
        <div className="text-sm text-muted-foreground hidden md:block">
          {formatTimeAgo(lastRefreshed)}
        </div>
      )}
    </div>
  )
}