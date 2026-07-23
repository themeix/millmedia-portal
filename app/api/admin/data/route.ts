import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Get recent sync runs
    const { data: syncRuns, error: syncError } = await supabase
      .from('sync_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (syncError) {
      return NextResponse.json({ error: syncError.message }, { status: 500 })
    }
    
    // Get subscriber targets
    const { data: targets, error: targetError } = await supabase
      .from('subscriber_targets')
      .select('*')
      .order('month', { ascending: false })
      .limit(10)
    
    if (targetError) {
      return NextResponse.json({ error: targetError.message }, { status: 500 })
    }
    
    // Get current counts for progress calculation
    const { count: paidCount } = await supabase
      .from('paying_members')
      .select('*', { count: 'exact', head: true })
    
    const { count: freeCount } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
    
    // Calculate progress for each target
    const targetsWithProgress = (targets || []).map(target => {
      const current = target.metric_type === 'paid' ? (paidCount || 0) : (freeCount || 0)
      const progress = current > 0 ? ((current / target.target_value) * 100) : 0
      return {
        ...target,
        current,
        progress: Math.min(progress, 100)
      }
    })
    
    return NextResponse.json({ 
      syncRuns: syncRuns || [],
      targets: targetsWithProgress,
      paidCount: paidCount || 0,
      freeCount: freeCount || 0
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch admin data' }, { status: 500 })
  }
}