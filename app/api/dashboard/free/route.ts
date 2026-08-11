import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { publications } from '@/lib/publications'
import { applyFreeSubscriberFilters, fetchAllRows } from '@/lib/queries'

export const dynamic = 'force-static'
export const revalidate = 300

export async function GET() {
  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const publicationStats = await Promise.all(
      publications.map(async (pub) => {
        const [
          { count: currentTotal },
          { count: newThisMonth },
          { count: last30Days }
        ] = await Promise.all([
          applyFreeSubscriberFilters(
            supabase
              .from('members')
              .select('*', { count: 'exact', head: true })
              .eq('site_id', pub.siteId)
          ),

          applyFreeSubscriberFilters(
            supabase
              .from('members')
              .select('*', { count: 'exact', head: true })
              .eq('site_id', pub.siteId)
          ).gte('created_at', monthStart.toISOString()),

          supabase
            .from('newsletter_subscribers')
            .select('*', { count: 'exact', head: true })
            .eq('site_id', pub.siteId)
            .gte('created_at', last30.toISOString())
        ])

        return {
          siteId: pub.siteId,
          name: pub.name,
          domain: pub.domain,
          target: pub.target,
          current: currentTotal || 0,
          newThisMonth: newThisMonth || 0,
          last30Days: last30Days || 0
        }
      })
    )

    const [{ count: totalCurrent }, { count: totalNewThisMonth }, { count: totalLast30Days }] = await Promise.all([
      applyFreeSubscriberFilters(
        supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
      ),

      applyFreeSubscriberFilters(
        supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
      ).gte('created_at', monthStart.toISOString()),

      applyFreeSubscriberFilters(
        supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
      ).gte('created_at', last30.toISOString())
    ])

    const dailyRecords = await fetchAllRows(() =>
      applyFreeSubscriberFilters(
        supabase
          .from('members')
          .select('created_at')
      ).gte('created_at', last30.toISOString())
    )

    const dailyCounts: Record<string, number> = {}
    const weeklyCounts: Record<string, number> = {}
    for (const record of dailyRecords) {
      const date = new Date(record.created_at)
      const dateStr = date.toISOString().split('T')[0]
      
      dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1
      
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekStartStr = weekStart.toISOString().split('T')[0]
      weeklyCounts[weekStartStr] = (weeklyCounts[weekStartStr] || 0) + 1
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
    const totalWeeks = Math.ceil(30 / 7)
    for (let i = 0; i < totalWeeks; i++) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekStartStr = weekStart.toISOString().split('T')[0]
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      const weekEndStr = weekEnd.toISOString().split('T')[0]
      
      weeklyData.push({
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        actual: weeklyCounts[weekStartStr] || 0
      })
    }
    
    weeklyData.sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime())
    
    return NextResponse.json({ 
      publications: publicationStats,
      allCompany: {
        current: totalCurrent,
        newThisMonth: totalNewThisMonth,
        last30Days: totalLast30Days
      },
      dailyData: dailyData,
      weeklyData: weeklyData,
      dateRange: {
        start: dailyData[0]?.date || '',
        end: dailyData[dailyData.length - 1]?.date || ''
      },
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('Error in free API:', error)
    return NextResponse.json({ error: 'Failed to fetch daily data' }, { status: 500 })
  }
}