// Applies the accurate "free subscriber actually receiving emails" filter set
// to a members-table Supabase query builder.
//
// A free subscriber counts when:
//   status = 'free'
//   subscribed_to_email = true
//   is_active = true
//   deleted_at IS NULL
//   email_suppressed IS NOT TRUE (false or null)
export function applyFreeSubscriberFilters(query: any) {
  return query
    .eq('status', 'free')
    .eq('subscribed_to_email', true)
    .eq('is_active', true)
    .is('deleted_at', null)
    .or('email_suppressed.eq.false,email_suppressed.is.null')
}

// Supabase caps REST responses at 1000 rows per request.
// This paginates through all matching rows by calling buildQuery()
// (which must return a FRESH query builder each call) in batches.
export async function fetchAllRows<T = any>(
  buildQuery: () => any,
  batchSize = 1000
): Promise<T[]> {
  const allRows: T[] = []
  let offset = 0

  while (true) {
    const { data, error } = await buildQuery().range(offset, offset + batchSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < batchSize) break
    offset += batchSize
  }

  return allRows
}
