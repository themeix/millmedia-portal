import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const now = new Date()
    const historicalData = []
    
    // Generate 7-day rolling windows for the last 3 months
    const numberOfWindows = 13 // ~90 days / 7 days = ~13 windows
    
    for (let i = numberOfWindows; i >= 0; i--) {
      const windowEnd = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000))
      
      // Format the date as a readable label
      const dateLabel = windowEnd.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: '2-digit'
      })
      
      // Generate realistic growth data for free subscribers
      const baseSubscribers = 250000
      const growthRate = 0.01 // 1% weekly growth
      const randomFluctuation = (Math.random() - 0.5) * 2000
      
      const actual = Math.floor(baseSubscribers * Math.pow(1 + growthRate, (12 - i)) + randomFluctuation)
      
      // Calculate new subscribers in this 7-day window
      const newThisWeek = Math.floor(2000 + Math.random() * 3000)
      
      // Calculate target pace
      const allCompanyTarget = 500000
      const progressFraction = Math.max(0, (i / numberOfWindows))
      const cumulativeTarget = allCompanyTarget * progressFraction
      
      historicalData.push({
        date: dateLabel,
        actual: actual,
        newThisWeek: newThisWeek,
        target: cumulativeTarget,
        isoDate: windowEnd.toISOString()
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