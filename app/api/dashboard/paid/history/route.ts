import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const now = new Date()
    const historicalData = []
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const monthKey = `${year}-${String(month).padStart(2, '0')}`
      
      // Get all paying members created up to this point in time
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999).toISOString()
      
      const { count } = await supabase
        .from('paying_members')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', monthEnd)
      
      // Calculate target pace for this month
      const monthNumber = 12 - i
      const allCompanyTarget = 21200
      const targetPace = allCompanyTarget / 12
      const cumulativeTarget = targetPace * monthNumber
      
      historicalData.push({
        month: monthKey,
        actual: count || 0,
        target: cumulativeTarget
      })
    }
    
    return NextResponse.json({ 
      historicalData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch historical data' }, { status: 500 })
  }
}