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
