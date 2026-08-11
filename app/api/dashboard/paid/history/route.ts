import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { publications } from '@/lib/publications'
import { fetchAllRows } from '@/lib/queries'

function getWeeks(weeksCount: number) {
  const now = new Date()
  const weeks = []
  
  for (let i = weeksCount - 1; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (now.getDay() + 7 * i))
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    
    weeks.push({
      key: `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`,
      start: weekStart,
      end: weekEnd
    })
  }
  
  return weeks
}

function aggregateWeeklyData(weeks: any[], members: any[], baselineCount: number = 0) {
  let cumulativeCount = baselineCount
  return weeks.map(week => {
    const newInWeek = members.filter(member => {
      const memberDate = new Date(member.created_at)
      return memberDate >= week.start && memberDate <= week.end
    }).length
    
    cumulativeCount += newInWeek
    
    return {
      week: week.key,
      actual: cumulativeCount
    }
  })
}

async function getSiteHistoricalData(siteId: number, weeks: any[]) {
  const startDate = weeks[0].start.toISOString()
  
  // Get baseline count before the 52-week period
  const { count: baselineCount } = await supabase
    .from('paying_members')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .lt('created_at', startDate)
  
  // Get all members created during the 52-week period
  const members = await fetchAllRows(() =>
    supabase
      .from('paying_members')
      .select('created_at')
      .eq('site_id', siteId)
      .gte('created_at', startDate)
      .order('created_at', { ascending: true })
  )
  
  return aggregateWeeklyData(weeks, members, baselineCount || 0)
}

async function getAllSitesHistoricalData(weeks: any[]) {
  const startDate = weeks[0].start.toISOString()
  
  // Get baseline count before the 52-week period
  const { count: baselineCount } = await supabase
    .from('paying_members')
    .select('*', { count: 'exact', head: true })
    .lt('created_at', startDate)
  
  // Get all members created during the 52-week period
  const members = await fetchAllRows(() =>
    supabase
      .from('paying_members')
      .select('created_at')
      .gte('created_at', startDate)
      .order('created_at', { ascending: true })
  )
  
  let cumulativeCount = baselineCount || 0
  return weeks.map((week, index) => {
    const newInWeek = members.filter(member => {
      const memberDate = new Date(member.created_at)
      return memberDate >= week.start && memberDate <= week.end
    }).length
    
    cumulativeCount += newInWeek
    
    const weekNumber = index + 1
    const allCompanyTarget = 21200
    const targetPace = allCompanyTarget / 52
    const cumulativeTarget = targetPace * weekNumber
    
    return {
      week: week.key,
      actual: cumulativeCount,
      target: cumulativeTarget
    }
  })
}

export async function GET() {
  try {
    const weeks = getWeeks(52)
    const siteIds = publications.map(p => p.siteId)
    const allHistoricalData: Record<number, any[]> = {}
    
    const siteDataPromises = siteIds.map(siteId => 
      getSiteHistoricalData(siteId, weeks)
    )
    
    const siteDataResults = await Promise.all(siteDataPromises)
    
    siteIds.forEach((siteId, index) => {
      allHistoricalData[siteId] = siteDataResults[index]
    })
    
    const allSitesData = await getAllSitesHistoricalData(weeks)
    
    return NextResponse.json({ 
      historicalData: {
        all: allSitesData,
        ...allHistoricalData
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching historical data:', error)
    return NextResponse.json({ error: 'Failed to fetch historical data' }, { status: 500 })
  }
}