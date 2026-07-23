import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { PUBLICATION_CONFIG, getPublicationName } from '@/lib/config'

export async function GET() {
  try {
    // Get current counts per publication
    const publicationData = []
    const totalData = { current: 0, newThisMonth: 0, thirtyDayGrowth: 0 }
    
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    for (const [siteId, config] of Object.entries(PUBLICATION_CONFIG)) {
      const siteIdNum = parseInt(siteId)
      
      // Get current paying subscribers for this publication
      const { count: currentCount } = await supabase
        .from('paying_members')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteIdNum)
      
      // Get new paying members this month
      const { count: newThisMonth } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteIdNum)
        .eq('status', 'paid')
        .gte('created_at', startOfMonth)
      
      // Get 30-day growth
      const { count: thirtyDayGrowth } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteIdNum)
        .eq('status', 'paid')
        .gte('created_at', thirtyDaysAgo)
      
      const current = currentCount || 0
      const newThisMonthCount = newThisMonth || 0
      const thirtyDayGrowthCount = thirtyDayGrowth || 0
      const target = config.monthlyTarget
      const progress = target > 0 ? ((current / target) * 100) : 0
      
      publicationData.push({
        siteId: siteIdNum,
        name: config.name,
        domain: config.domain,
        current,
        newThisMonth: newThisMonthCount,
        thirtyDayGrowth: thirtyDayGrowthCount,
        target,
        progress: Math.min(progress, 100)
      })
      
      totalData.current += current
      totalData.newThisMonth += newThisMonthCount
      totalData.thirtyDayGrowth += thirtyDayGrowthCount
    }
    
    // Get historical data for charts (last 12 months)
    const historicalData = []
    const months = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(date.toISOString().split('T')[0])
    }
    
    for (const month of months) {
      const monthStart = new Date(month + 'T00:00:00.000Z').toISOString()
      const monthEnd = new Date(new Date(month + 'T00:00:00.000Z').setMonth(new Date(month + 'T00:00:00.000Z').getMonth() + 1)).toISOString()
      
      const { count: monthCount } = await supabase
        .from('paying_members')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart)
        .lt('created_at', monthEnd)
      
      historicalData.push({
        month: month,
        subscribers: monthCount || 0
      })
    }
    
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