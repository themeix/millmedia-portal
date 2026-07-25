import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { PUBLICATION_CONFIG, getPublicationName } from '@/lib/config'

export async function GET() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const siteIds = Object.keys(PUBLICATION_CONFIG).map(id => parseInt(id))
    
    const publicationDataPromises = siteIds.map(async (siteIdNum) => {
      const config = (PUBLICATION_CONFIG as Record<number, any>)[siteIdNum]
      
      const [
        { count: currentCount },
        { count: newThisMonth },
        { count: thirtyDayGrowth }
      ] = await Promise.all([
        supabase
          .from('paying_members')
          .select('*', { count: 'exact', head: true })
          .eq('site_id', siteIdNum),
        
        supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('site_id', siteIdNum)
          .eq('status', 'paid')
          .gte('created_at', startOfMonth),
        
        supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('site_id', siteIdNum)
          .eq('status', 'paid')
          .gte('created_at', thirtyDaysAgo)
      ])
      
      const current = currentCount || 0
      const newThisMonthCount = newThisMonth || 0
      const thirtyDayGrowthCount = thirtyDayGrowth || 0
      const target = config.monthlyTarget
      const progress = target > 0 ? ((current / target) * 100) : 0
      
      return {
        siteId: siteIdNum,
        name: config.name,
        domain: config.domain,
        current,
        newThisMonth: newThisMonthCount,
        thirtyDayGrowth: thirtyDayGrowthCount,
        target,
        progress: Math.min(progress, 100)
      }
    })
    
    const publicationData = await Promise.all(publicationDataPromises)
    const totalData = publicationData.reduce((acc, pub) => ({
      current: acc.current + pub.current,
      newThisMonth: acc.newThisMonth + pub.newThisMonth,
      thirtyDayGrowth: acc.thirtyDayGrowth + pub.thirtyDayGrowth
    }), { current: 0, newThisMonth: 0, thirtyDayGrowth: 0 })
    
    // Get historical data for charts (last 12 months) - optimized with single query
    const months = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        key: date.toISOString().split('T')[0],
        start: new Date(date.getFullYear(), date.getMonth(), 1),
        end: new Date(date.getFullYear(), date.getMonth() + 1, 1)
      })
    }
    
    const historicalStart = months[0].start.toISOString()
    const historicalEnd = months[months.length - 1].end.toISOString()
    
    const { data: historicalMembers } = await supabase
      .from('paying_members')
      .select('created_at')
      .gte('created_at', historicalStart)
      .lt('created_at', historicalEnd)
    
    const historicalData = months.map(month => {
      const monthCount = historicalMembers?.filter(member => {
        const memberDate = new Date(member.created_at)
        return memberDate >= month.start && memberDate < month.end
      }).length || 0
      
      return {
        month: month.key,
        subscribers: monthCount
      }
    })
    
    // Calculate pace-to-target data
    const paceData = historicalData.map((data, index) => {
      const monthNumber = index + 1
      const targetPace = 21200 / 12 // Total target divided by 12 months
      const cumulativeTarget = targetPace * monthNumber
      return {
        month: data.month,
        actual: data.subscribers,
        target: cumulativeTarget
      }
    })
    
    return NextResponse.json({ 
      publications: publicationData,
      allCompany: {
        current: totalData.current,
        newThisMonth: totalData.newThisMonth,
        thirtyDayGrowth: totalData.thirtyDayGrowth,
        target: 21200,
        progress: ((totalData.current / 21200) * 100).toFixed(1)
      },
      historicalData: paceData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch paid subscribers data' }, { status: 500 })
  }
}