import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { publications } from '@/lib/publications'

const LS_KEY = 'publication_targets'

function loadLocal() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function saveLocal(value: any) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(value))
  } catch {}
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('publication_targets')
      .select('*')
      .order('site_id', { ascending: true })

    if (error) {
      console.error('Admin targets GET error:', error)
      return NextResponse.json({ targets: [], dbError: error.message }, { status: 200 })
    }

    if (data && data.length > 0) {
      saveLocal(data)
      return NextResponse.json({ targets: data })
    }
  } catch {}

  const cached = loadLocal()
  if (cached && cached.length > 0) {
    return NextResponse.json({ targets: cached })
  }

  const fallback = publications.flatMap((pub) => [
    { site_id: pub.siteId, metric_type: 'free', target_value: pub.target ?? 0 },
    { site_id: pub.siteId, metric_type: 'paid', target_value: pub.target ?? 0 }
  ])
  return NextResponse.json({ targets: fallback })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const targets = body?.targets

    if (!Array.isArray(targets)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const ops = targets.map((item) =>
      supabase
        .from('publication_targets')
        .upsert({ 
          site_id: item.site_id, 
          metric_type: item.metric_type,
          target_value: item.target_value 
        }, { onConflict: 'site_id,metric_type' })
    )

    const results = await Promise.all(ops)
    const errors = results.filter((r: any) => r.error)
    if (errors.length > 0) {
      console.error('Admin targets POST upsert errors:', errors.map((r: any) => r.error))
      return NextResponse.json({ 
        targets, 
        error: 'Some saves failed', 
        details: errors.map((r: any) => r.error.message || String(r.error))
      }, { status: 500 })
    }
    saveLocal(targets)

    return NextResponse.json({ targets })
  } catch (error) {
    console.error('Admin targets POST error:', error)
    return NextResponse.json({ error: 'Failed to save targets', details: String(error) }, { status: 500 })
  }
}
