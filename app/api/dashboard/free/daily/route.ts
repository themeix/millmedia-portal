import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { publications } from '@/lib/publications'

export const dynamic = 'force-static'
export const revalidate = 300

export async function GET() {
  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const generateTimeSeries = (records: any[] | null) => {
      const dailyCounts: Record<string, number> = {}
      const weeklyCounts: Record<string, number> = {}

      if (records) {
        for (const record of records) {
          const recordDate = new Date(record.created_at)
          const dateStr = recordDate.toISOString().split('T')[0]
          
          dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1
          
          const weekStart = new Date(recordDate)
          weekStart.setDate(recordDate.getDate() - recordDate.getDay())
          const weekStartStr = weekStart.toISOString().split('T')[0]
          weeklyCounts[weekStartStr] = (weeklyCounts[weekStartStr] || 0) + 1
        }
      }

      const dailyData = []
      for (let i = 0; i < 30; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        dailyData.push({
          date: dateStr,
          actual: dailyCounts[dateStr] || 0
        })
      }
      dailyData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const weeklyData = []
    const totalWeeks = 6
    
    // Calculate the start of the first week we should include (within our 30-day range)
    const firstWeekStart = new Date(last30)
    firstWeekStart.setDate(firstWeekStart.getDate() - firstWeekStart.getDay())
    
    for (let i = 0; i < totalWeeks; i++) {
      const weekStart = new Date(firstWeekStart.getTime() + i * 7 * 24 * 60 * 60 * 1000)
      const weekStartStr = weekStart.toISOString().split('T')[0]
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      const weekEndStr = weekEnd.toISOString().split('T')[0]
      
      // Only include weeks that are not entirely in the future
      if (weekStart <= now) {
        weeklyData.push({
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
          actual: weeklyCounts[weekStartStr] || 0
        })
      }
    }

      return { dailyData, weeklyData }
    }

    const publicationStats = await Promise.all(
      publications.map(async (pub) => {
        const [
          { count: currentTotal },
          { count: newThisMonth },
          { count: last30Days }
        ] = await Promise.all([
          supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('site_id', pub.siteId)
            .eq('status', 'free'),

          supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('site_id', pub.siteId)
            .eq('status', 'free')
            .gte('created_at', monthStart.toISOString()),

          supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('site_id', pub.siteId)
            .eq('status', 'free')
            .gte('created_at', last30.toISOString())
        ])

        const { data: targetRow, error: targetError } = await supabase
          .from('publication_targets')
          .select('target_value')
          .eq('site_id', pub.siteId)
          .eq('metric_type', 'free')
          .maybeSingle()

        if (targetError) {
          console.error('Free target query error:', targetError)
        }

        const target = targetRow?.target_value ?? pub.target
        if (!targetRow) {
          console.warn('Free target missing in DB for site_id=', pub.siteId, 'falling back to', target)
        }

        return {
          siteId: pub.siteId,
          name: pub.name,
          domain: pub.domain,
          target,
          current: currentTotal || 0,
          newThisMonth: newThisMonth || 0,
          last30Days: last30Days || 0
        }
      })
    )

    const [{ count: totalCurrent }, { count: totalNewThisMonth }, { count: totalLast30Days }] = await Promise.all([
      supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'free'),

      supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'free')
        .gte('created_at', monthStart.toISOString()),

      supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'free')
        .gte('created_at', last30.toISOString())
    ])

    const siteTimeSeriesDataPromises = publications.map(async (pub) => {
      const { data: siteRecords } = await supabase
        .from('members')
        .select('created_at')
        .eq('status', 'free')
        .eq('site_id', pub.siteId)
        .gte('created_at', last30.toISOString())
        .order('created_at', { ascending: true })

      return { siteId: String(pub.siteId), data: generateTimeSeries(siteRecords) }
    })

    const siteTimeSeriesResults = await Promise.all(siteTimeSeriesDataPromises)
    const siteTimeSeriesData: Record<string, { dailyData: any[], weeklyData: any[] }> = {}
    siteTimeSeriesResults.forEach(result => {
      siteTimeSeriesData[result.siteId] = result.data
    })

    const allDailyCounts: Record<string, number> = {}
    const allWeeklyCounts: Record<string, number> = {}
    
    for (const [siteId, siteData] of Object.entries(siteTimeSeriesData)) {
      siteData.dailyData.forEach((day: any) => {
        allDailyCounts[day.date] = (allDailyCounts[day.date] || 0) + day.actual
      })
      siteData.weeklyData.forEach((week: any) => {
        allWeeklyCounts[week.weekStart] = (allWeeklyCounts[week.weekStart] || 0) + week.actual
      })
    }

    const allDailyData = []
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      allDailyData.push({
        date: dateStr,
        actual: allDailyCounts[dateStr] || 0
      })
    }
    allDailyData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const allWeeklyData = []
    const totalWeeks = 6
    
    // Calculate the start of the first week we should include (within our 30-day range)
    const firstWeekStart = new Date(last30)
    firstWeekStart.setDate(firstWeekStart.getDate() - firstWeekStart.getDay())
    
    for (let i = 0; i < totalWeeks; i++) {
      const weekStart = new Date(firstWeekStart.getTime() + i * 7 * 24 * 60 * 60 * 1000)
      const weekStartStr = weekStart.toISOString().split('T')[0]
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      const weekEndStr = weekEnd.toISOString().split('T')[0]
      
      // Only include weeks that are not entirely in the future
      if (weekStart <= now) {
        allWeeklyData.push({
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
          actual: allWeeklyCounts[weekStartStr] || 0
        })
      }
    }

    const timeSeriesData = {
      ...siteTimeSeriesData,
      all: { dailyData: allDailyData, weeklyData: allWeeklyData }
    }

    return NextResponse.json({ 
      publications: publicationStats,
      timeSeriesData,
      summary: {
        current: (totalCurrent || 0).toLocaleString(),
        ninetyDaysAgo: ((totalCurrent || 0) - (totalLast30Days || 0)).toLocaleString(),
        growth: (totalLast30Days || 0).toLocaleString(),
        growthRate: totalCurrent ? ((totalLast30Days || 0) / totalCurrent * 100).toFixed(1) : '0',
        dateRange: allDailyData.length > 0 ? `${allDailyData[0].date} - ${allDailyData[allDailyData.length - 1].date}` : ''
      },
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('Error in free/daily API:', error)
    return NextResponse.json({ error: 'Failed to fetch daily data' }, { status: 500 })
  }
}